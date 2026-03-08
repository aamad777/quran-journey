// Tajweed bracket notation parser for AlQuran Cloud API (quran-tajweed edition)
// Format: [rule:optional_num[text]] or [rule[text]]

export interface TajweedSegment {
  text: string;
  rule: string | null; // null = plain text
}

export const TAJWEED_RULES: Record<string, { label: string; labelAr: string; color: string; bg: string }> = {
  n: { label: "Ghunnah", labelAr: "غُنَّة", color: "#2d8a4e", bg: "rgba(45,138,78,0.12)" },
  a: { label: "Ikhfa", labelAr: "إخفاء", color: "#c97c1a", bg: "rgba(201,124,26,0.12)" },
  u: { label: "Idgham (no ghunnah)", labelAr: "إدغام بلا غنة", color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
  m: { label: "Madd", labelAr: "مَدّ", color: "#2563eb", bg: "rgba(37,99,235,0.12)" },
  o: { label: "Madd Lazim", labelAr: "مَدّ لازم", color: "#dc2626", bg: "rgba(220,38,38,0.12)" },
  l: { label: "Lam Shamsiyyah", labelAr: "لام شمسية", color: "#0d9488", bg: "rgba(13,148,136,0.12)" },
  h: { label: "Hamzat Al-Wasl", labelAr: "همزة الوصل", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  f: { label: "Ikhfa Shafawi", labelAr: "إخفاء شفوي", color: "#db2777", bg: "rgba(219,39,119,0.12)" },
  p: { label: "Qalqalah", labelAr: "قلقلة", color: "#e11d48", bg: "rgba(225,29,72,0.12)" },
};

export function parseTajweed(text: string): TajweedSegment[] {
  const segments: TajweedSegment[] = [];
  let i = 0;
  let plain = "";

  const flush = () => {
    if (plain) {
      segments.push({ text: plain, rule: null });
      plain = "";
    }
  };

  while (i < text.length) {
    if (text[i] === "[") {
      flush();
      // Parse rule: [rule[ or [rule:num[
      const ruleMatch = text.slice(i).match(/^\[([a-z])(?::\d+)?\[/);
      if (ruleMatch) {
        const ruleChar = ruleMatch[1];
        i += ruleMatch[0].length;
        // Find matching ]] — but handle nested brackets
        let depth = 1;
        let inner = "";
        while (i < text.length && depth > 0) {
          if (text[i] === "[") depth++;
          else if (text[i] === "]") {
            depth--;
            if (depth === 0) {
              i++; // skip closing ]
              break;
            }
          }
          if (depth > 0) inner += text[i];
          i++;
        }
        // Inner might contain nested tajweed — recursively parse
        const innerSegments = parseTajweed(inner);
        // Apply this rule to segments that don't already have one
        for (const seg of innerSegments) {
          segments.push({ text: seg.text, rule: seg.rule || ruleChar });
        }
      } else {
        plain += text[i];
        i++;
      }
    } else if (text[i] === "]") {
      // Stray closing bracket, skip
      i++;
    } else {
      plain += text[i];
      i++;
    }
  }

  flush();
  return segments;
}
