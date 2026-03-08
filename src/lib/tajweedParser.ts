// Tajweed bracket notation parser for AlQuran Cloud API (quran-tajweed edition)
// Format: [rule:optional_num[text]] or [rule[text]]

export interface TajweedSegment {
  text: string;
  rule: string | null; // null = plain text
}

export interface TajweedRuleInfo {
  label: string;
  labelAr: string;
  color: string;
  description: string;
  howTo: string;
  example: string;
}

export const TAJWEED_RULES: Record<string, TajweedRuleInfo> = {
  n: {
    label: "Ghunnah",
    labelAr: "غُنَّة",
    color: "#2d8a4e",
    description: "صوت أغنّ يخرج من الخيشوم (الأنف) مقدار حركتين",
    howTo: "أمسك النون أو الميم المشددة مع إخراج الصوت من الأنف لمدة حركتين",
    example: "إِنَّ ، ثُمَّ",
  },
  a: {
    label: "Ikhfa",
    labelAr: "إخفاء",
    color: "#c97c1a",
    description: "إخفاء النون الساكنة أو التنوين عند أحد حروف الإخفاء الـ15",
    howTo: "انطق النون بصوت بين الإظهار والإدغام مع غنة حركتين",
    example: "مِنْ قَبْلُ ، يَنْصُرُ",
  },
  u: {
    label: "Idgham (no ghunnah)",
    labelAr: "إدغام بلا غنة",
    color: "#7c3aed",
    description: "إدغام النون الساكنة أو التنوين في اللام أو الراء بدون غنة",
    howTo: "أدغم النون في الحرف التالي (ل أو ر) مباشرة بدون غنة",
    example: "مِنْ رَبِّهِمْ ، مِنْ لَدُنْهُ",
  },
  m: {
    label: "Madd",
    labelAr: "مَدّ",
    color: "#2563eb",
    description: "مدّ الصوت بحرف من حروف المد (ا، و، ي) من 2 إلى 6 حركات",
    howTo: "مُدّ حرف المد بمقدار حركتين أو أكثر حسب نوع المد",
    example: "قَالُوا ، فِيهَا",
  },
  o: {
    label: "Madd Lazim",
    labelAr: "مَدّ لازم",
    color: "#dc2626",
    description: "مدّ لازم يُمَدّ 6 حركات وجوباً عند وجود سكون أصلي بعد حرف المد",
    howTo: "مُدّ الحرف 6 حركات كاملة (أطول مدّ في التجويد)",
    example: "الْحَاقَّةُ ، الضَّالِّينَ",
  },
  l: {
    label: "Lam Shamsiyyah",
    labelAr: "لام شمسية",
    color: "#0d9488",
    description: "اللام في (ال) التعريف لا تُنطق وتُدغم في الحرف الشمسي بعدها",
    howTo: "لا تنطق اللام، وشدّد الحرف الذي بعدها",
    example: "الشَّمْسُ ، النَّاسِ",
  },
  h: {
    label: "Hamzat Al-Wasl",
    labelAr: "همزة الوصل",
    color: "#a855f7",
    description: "همزة تُنطق في بداية الكلام وتسقط في الوصل (الدرج)",
    howTo: "انطقها عند البدء بالكلمة، واحذفها عند الوصل بما قبلها",
    example: "اسْتَغْفِرْ ، اذْهَبْ",
  },
  f: {
    label: "Ikhfa Shafawi",
    labelAr: "إخفاء شفوي",
    color: "#db2777",
    description: "إخفاء الميم الساكنة عند حرف الباء مع غنة",
    howTo: "أخفِ الميم عند الباء مع إبقاء غنة خفيفة من الأنف",
    example: "تَرْمِيهِمْ بِحِجَارَةٍ",
  },
  p: {
    label: "Qalqalah",
    labelAr: "قلقلة",
    color: "#e11d48",
    description: "اضطراب الصوت عند نطق أحد حروف (ق ط ب ج د) الساكنة",
    howTo: "انطق الحرف الساكن بنبرة قوية مع اهتزاز خفيف (كأنه يرتد)",
    example: "يَخْلُقْ ، أَحَدْ ، لَمْ يَلِدْ",
  },
  i: {
    label: "Idgham with Ghunnah",
    labelAr: "إدغام بغنة",
    color: "#059669",
    description: "إدغام النون الساكنة أو التنوين في (ي ن م و) مع غنة حركتين",
    howTo: "أدغم النون في الحرف التالي مع إخراج غنة من الأنف لمدة حركتين",
    example: "مِنْ يَعْمَلْ ، مِنْ وَلِيٍّ",
  },
  q: {
    label: "Iqlab",
    labelAr: "إقلاب",
    color: "#7c2d12",
    description: "قلب النون الساكنة أو التنوين ميماً عند حرف الباء",
    howTo: "حوّل النون إلى ميم مع غنة حركتين قبل الباء",
    example: "أَنْبِئْهُمْ ، سَمِيعٌ بَصِيرٌ",
  },
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
      const ruleMatch = text.slice(i).match(/^\[([a-z])(?::\d+)?\[/);
      if (ruleMatch) {
        const ruleChar = ruleMatch[1];
        i += ruleMatch[0].length;
        let depth = 1;
        let inner = "";
        while (i < text.length && depth > 0) {
          if (text[i] === "[") depth++;
          else if (text[i] === "]") {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          }
          if (depth > 0) inner += text[i];
          i++;
        }
        const innerSegments = parseTajweed(inner);
        for (const seg of innerSegments) {
          segments.push({ text: seg.text, rule: seg.rule || ruleChar });
        }
      } else {
        plain += text[i];
        i++;
      }
    } else if (text[i] === "]") {
      i++;
    } else {
      plain += text[i];
      i++;
    }
  }

  flush();
  return segments;
}
