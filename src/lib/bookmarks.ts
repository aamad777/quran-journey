import { useEffect, useState, useCallback } from "react";

/** Verse bookmarks stored in localStorage. */

const KEY = "quran_bookmarks_v1";

export interface Bookmark {
  surah: number;
  ayah: number;
  surahNameArabic: string;
  arabicPreview: string; // first ~80 chars
  addedAt: number;
}

function readAll(): Bookmark[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(list: Bookmark[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  window.dispatchEvent(new Event("quran-bookmarks-updated"));
}

export function isBookmarked(surah: number, ayah: number): boolean {
  return readAll().some((b) => b.surah === surah && b.ayah === ayah);
}

export function toggleBookmark(b: Omit<Bookmark, "addedAt">): boolean {
  const list = readAll();
  const idx = list.findIndex((x) => x.surah === b.surah && x.ayah === b.ayah);
  if (idx >= 0) {
    list.splice(idx, 1);
    writeAll(list);
    return false;
  }
  list.unshift({ ...b, addedAt: Date.now() });
  writeAll(list);
  return true;
}

export function removeBookmark(surah: number, ayah: number) {
  writeAll(readAll().filter((b) => !(b.surah === surah && b.ayah === ayah)));
}

export function useBookmarks(): Bookmark[] {
  const [list, setList] = useState<Bookmark[]>(() => readAll());
  useEffect(() => {
    const refresh = () => setList(readAll());
    window.addEventListener("quran-bookmarks-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("quran-bookmarks-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return list;
}

export function useIsBookmarked(surah: number, ayah: number): boolean {
  const list = useBookmarks();
  return list.some((b) => b.surah === surah && b.ayah === ayah);
}
