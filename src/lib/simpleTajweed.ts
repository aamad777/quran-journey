// Lightweight tajweed coloring for Uthmani text.
// Heuristics (visual aid only — not authoritative):
//  - Madd letters with small superscript marks (ٰ ٓ) → blue (مدّ)
//  - Shaddah on ن or م → green (غنّة)
//  - Standalone tilde ٓ marks (madd lazim cue) → red
// Returns array of { text, color? } segments.

export interface TajweedSeg {
  text: string;
  color?: string;
}

const COLOR_GHUNNAH = "#1f7a3a"; // green
const COLOR_MADD = "#1d4ed8"; // blue
const COLOR_MADD_LAZIM = "#b91c1c"; // red

export function colorizeUthmani(text: string): TajweedSeg[] {
  const segs: TajweedSeg[] = [];
  const chars = Array.from(text);
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    const next = chars[i + 1];
    const next2 = chars[i + 2];

    // Ghunnah: ن or م followed by shaddah ّ (U+0651), possibly with a vowel between
    if ((ch === "ن" || ch === "م")) {
      // look ahead within next 2 chars for shaddah
      if (next === "ّ" || next2 === "ّ") {
        // consume base + diacritics until non-diacritic
        let j = i + 1;
        while (j < chars.length && isDiacritic(chars[j])) j++;
        segs.push({ text: chars.slice(i, j).join(""), color: COLOR_GHUNNAH });
        i = j;
        continue;
      }
    }

    // Madd lazim cue: presence of ٓ (U+0653 maddah above) — color the base + maddah
    if (next === "ٓ") {
      let j = i + 1;
      while (j < chars.length && isDiacritic(chars[j])) j++;
      segs.push({ text: chars.slice(i, j).join(""), color: COLOR_MADD_LAZIM });
      i = j;
      continue;
    }

    // Madd: alef/waw/ya as madd letters following a vowel (basic heuristic)
    // mark dagger alef ٰ (U+0670) as madd
    if (ch === "ٰ" || ch === "ـٰ") {
      segs.push({ text: ch, color: COLOR_MADD });
      i++;
      continue;
    }

    // Default: append to last plain segment
    const last = segs[segs.length - 1];
    if (last && !last.color) last.text += ch;
    else segs.push({ text: ch });
    i++;
  }
  return segs;
}

function isDiacritic(ch: string): boolean {
  const code = ch.charCodeAt(0);
  // Arabic diacritics range
  return (
    (code >= 0x064b && code <= 0x065f) ||
    code === 0x0670 ||
    code === 0x06d6 ||
    code === 0x06d7 ||
    code === 0x06d8 ||
    code === 0x06d9 ||
    code === 0x06da ||
    code === 0x06db ||
    code === 0x06dc ||
    code === 0x06df ||
    code === 0x06e0 ||
    code === 0x06e1 ||
    code === 0x06e2 ||
    code === 0x06e3 ||
    code === 0x06e4 ||
    code === 0x06e5 ||
    code === 0x06e6 ||
    code === 0x06e7 ||
    code === 0x06e8 ||
    code === 0x06ea ||
    code === 0x06eb ||
    code === 0x06ec ||
    code === 0x06ed
  );
}
