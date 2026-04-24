// IndexedDB-based audio cache for offline Quran recitation playback.
// Stores MP3 blobs keyed by their original URL and exposes helpers to
// resolve a URL to a local blob URL, download verses/surahs, and inspect
// or clear storage usage.

const DB_NAME = "quran_audio_cache";
const STORE = "audio";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "url" });
        os.createIndex("reciter", "reciter", { unique: false });
        os.createIndex("surah", "surah", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

interface CacheEntry {
  url: string;
  blob: Blob;
  size: number;
  reciter: string;
  surah: number;
  ayah: number; // 0 = full surah
  ts: number;
}

function tx(mode: IDBTransactionMode) {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

export async function hasCached(url: string): Promise<boolean> {
  if (!url) return false;
  const store = await tx("readonly");
  return new Promise((resolve) => {
    const req = store.getKey(url);
    req.onsuccess = () => resolve(req.result !== undefined);
    req.onerror = () => resolve(false);
  });
}

export async function getCachedBlob(url: string): Promise<Blob | null> {
  if (!url) return null;
  const store = await tx("readonly");
  return new Promise((resolve) => {
    const req = store.get(url);
    req.onsuccess = () => resolve(req.result?.blob ?? null);
    req.onerror = () => resolve(null);
  });
}

export async function putCached(
  url: string,
  blob: Blob,
  meta: { reciter: string; surah: number; ayah: number },
): Promise<void> {
  const store = await tx("readwrite");
  const entry: CacheEntry = {
    url,
    blob,
    size: blob.size,
    reciter: meta.reciter,
    surah: meta.surah,
    ayah: meta.ayah,
    ts: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Track in-flight blob URLs to avoid leaks; revoke on next resolve.
const blobUrlMap = new Map<string, string>();

/** Returns a playable URL — local blob if cached, otherwise the original URL. */
export async function resolveAudioUrl(url: string): Promise<string> {
  if (!url) return url;
  const blob = await getCachedBlob(url);
  if (!blob) return url;
  const existing = blobUrlMap.get(url);
  if (existing) return existing;
  const blobUrl = URL.createObjectURL(blob);
  blobUrlMap.set(url, blobUrl);
  return blobUrl;
}

/** Downloads a URL and stores its blob. Returns true if newly cached. */
export async function downloadAndCache(
  url: string,
  meta: { reciter: string; surah: number; ayah: number },
): Promise<boolean> {
  if (!url) return false;
  if (await hasCached(url)) return false;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  await putCached(url, blob, meta);
  return true;
}

export interface CacheStats {
  totalBytes: number;
  totalCount: number;
  byReciter: Record<string, { count: number; bytes: number }>;
}

export async function getCacheStats(): Promise<CacheStats> {
  const store = await tx("readonly");
  return new Promise((resolve) => {
    const stats: CacheStats = { totalBytes: 0, totalCount: 0, byReciter: {} };
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const v = cursor.value as CacheEntry;
        stats.totalBytes += v.size;
        stats.totalCount += 1;
        const r = (stats.byReciter[v.reciter] ||= { count: 0, bytes: 0 });
        r.count += 1;
        r.bytes += v.size;
        cursor.continue();
      } else {
        resolve(stats);
      }
    };
    req.onerror = () => resolve(stats);
  });
}

export async function clearReciter(reciterId: string): Promise<void> {
  const store = await tx("readwrite");
  return new Promise((resolve) => {
    const idx = store.index("reciter");
    const req = idx.openCursor(IDBKeyRange.only(reciterId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => resolve();
  });
}

export async function clearAll(): Promise<void> {
  const store = await tx("readwrite");
  return new Promise((resolve) => {
    const req = store.clear();
    req.onsuccess = () => {
      blobUrlMap.forEach((u) => URL.revokeObjectURL(u));
      blobUrlMap.clear();
      resolve();
    };
    req.onerror = () => resolve();
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
