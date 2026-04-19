// Traditional 30-Juz boundaries by Mushaf page (Madani 15-line, 604 pages)
// Each entry: starting page of the juz. Juz 1 starts at page 1, Juz 2 at 22, etc.
export const JUZ_START_PAGES: number[] = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;

export function getJuzForPage(page: number): number {
  for (let i = JUZ_START_PAGES.length - 1; i >= 0; i--) {
    if (page >= JUZ_START_PAGES[i]) return i + 1;
  }
  return 1;
}

export function getJuzPageRange(juz: number): { start: number; end: number } {
  const start = JUZ_START_PAGES[juz - 1];
  const end = juz < TOTAL_JUZ ? JUZ_START_PAGES[juz] - 1 : TOTAL_PAGES;
  return { start, end };
}

export function getJuzPages(juz: number): number[] {
  const { start, end } = getJuzPageRange(juz);
  const out: number[] = [];
  for (let p = start; p <= end; p++) out.push(p);
  return out;
}
