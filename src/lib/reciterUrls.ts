// Helpers to build verse-level audio URLs without an API call.
// Mirrors the source definitions in useQuranVerse.ts so the Downloads
// page can prefetch entire surahs without spamming alquran.cloud.

export type ReciterSource =
  | { type: "alquran"; id: string }
  | { type: "everyayah"; folder: string }
  | { type: "mp3quran"; server: string; path: string };

export interface ReciterMeta {
  id: string;
  name: string;
  source: ReciterSource;
}

const pad3 = (n: number) => n.toString().padStart(3, "0");

/**
 * Build a direct verse audio URL when possible (everyayah / mp3quran).
 * Returns null for alquran.cloud sources which require an API call.
 */
export function buildVerseAudioUrl(
  source: ReciterSource,
  surah: number,
  ayah: number,
): string | null {
  switch (source.type) {
    case "everyayah":
      return `https://everyayah.com/data/${source.folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
    case "mp3quran":
      return `${source.server}/${source.path}/${pad3(surah)}.mp3`;
    case "alquran":
      return null;
  }
}

/** Returns true if the source plays one file per surah (not per ayah). */
export function isSurahLevelSource(source: ReciterSource): boolean {
  return source.type === "mp3quran";
}

/** Resolve verse-by-verse URLs through alquran.cloud when needed. */
export async function fetchAlquranAudioUrl(
  reciterId: string,
  surah: number,
  ayah: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${reciterId}`,
    );
    const data = await res.json();
    return data?.code === 200 && data.data?.audio ? data.data.audio : null;
  } catch {
    return null;
  }
}

export const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
  49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
  26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
  6, 3, 5, 4, 5, 6,
];
