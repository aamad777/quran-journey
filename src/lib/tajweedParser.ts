// Tajweed bracket notation parser for AlQuran Cloud API (quran-tajweed edition)
// Format: [rule:optional_num[text]] or [rule[text]]

export interface TajweedSegment {
  text: string;
  rule: string | null; // null = plain text
}

export const TAJWEED_RULES: Record<string, { label: string; labelAr: string; color: string }> = {
  n: { label: "Ghunnah", labelAr: "غُنَّة", color: "hsl(var(--tajweed-ghunnah))" },
  a: { label: "Ikhfa", labelAr: "إخفاء", color: "hsl(var(--tajweed-ikhfa))" },
  u: { label: "Idgham (no ghunnah)", labelAr: "إدغام بلا غنة", color: "hsl(var(--tajweed-idgham-no-ghunnah))" },
  m: { label: "Madd", labelAr: "مَدّ", color: "hsl(var(--tajweed-madd))" },
  o: { label: "Madd Lazim", labelAr: "مَدّ لازم", color: "hsl(var(--tajweed-madd-lazim))" },
  l: { label: "Lam Shamsiyyah", labelAr: "لام شمسية", color: "hsl(var(--tajweed-lam-shamsiyyah))" },
  h: { label: "Hamzat Al-Wasl", labelAr: "همزة الوصل", color: "hsl(var(--tajweed-hamzat-wasl))" },
  f: { label: "Ikhfa Shafawi", labelAr: "إخفاء شفوي", color: "hsl(var(--tajweed-ikhfa-shafawi))" },
  p: { label: "Qalqalah", labelAr: "قلقلة", color: "hsl(var(--tajweed-qalqalah))" },
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
