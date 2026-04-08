export interface LetterData {
  id: string;
  letter: string;
  name: string;
  makhraj: string;
  makhrajDesc: string;
  sifaat: string[];
  // Tajweed rule keys that apply to or are related to this letter
  tajweedRules: string[];
}

/**
 * Tajweed rules used (from TAJWEED_RULES in tajweedParser.ts):
 * n = غُنَّة           (Green)       - Ghunnah
 * a = إخفاء           (Orange)      - Ikhfa
 * u = إدغام بلا غنة  (Purple)      - Idgham no ghunnah
 * m = مَدّ             (Blue)        - Madd
 * o = مَدّ لازم        (Dark Red)    - Madd Lazim
 * l = لام شمسية       (Teal)        - Lam Shamsiyyah
 * h = همزة الوصل      (Violet)      - Hamzat Al-Wasl
 * f = إخفاء شفوي      (Pink)        - Ikhfa Shafawi
 * p = قلقلة           (Rose)        - Qalqalah
 * i = إدغام بغنة      (Emerald)     - Idgham with Ghunnah
 * q = إقلاب           (Brown)       - Iqlab
 */
export const ARABIC_ALPHABET: LetterData[] = [
  {
    id: "hamza", letter: "ء", name: "الهمزة",
    makhraj: "أقصى الحلق", makhrajDesc: "أبعد جزء من الحلق (مما يلي الصدر).",
    sifaat: ["الجهر", "الشدة", "الاستفال", "الانفتاح", "الإصمات"],
    tajweedRules: ["h", "m"]  // همزة الوصل + قد تكون قبل مد
  },
  {
    id: "alif", letter: "ا", name: "الألف المدية",
    makhraj: "الجوف", makhrajDesc: "التجويف الفراغي الممتد من فوق الحنجرة إلى الشفتين.",
    sifaat: ["الجهر", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات", "الخفاء"],
    tajweedRules: ["m", "o", "h"]  // مد طبيعي + مد لازم + همزة الوصل
  },
  {
    id: "baa", letter: "ب", name: "الباء",
    makhraj: "الشفتان", makhrajDesc: "بانطباق الشفتين معاً.",
    sifaat: ["الجهر", "الشدة", "الاستفال", "الانفتاح", "الإذلاق", "القلقلة"],
    tajweedRules: ["p", "q", "f", "a"]  // قلقلة + إقلاب + إخفاء شفوي + حرف إخفاء
  },
  {
    id: "taa", letter: "ت", name: "التاء",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع أصول الثنايا العليا.",
    sifaat: ["الهمس", "الشدة", "الاستفال", "الانفتاح", "الإصمات"],
    tajweedRules: ["a", "l"]  // حرف إخفاء + اللام الشمسية عند التاء
  },
  {
    id: "thaa", letter: "ث", name: "الثاء",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع أطراف الثنايا العليا.",
    sifaat: ["الهمس", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات"],
    tajweedRules: ["a", "l"]  // حرف إخفاء + اللام الشمسية
  },
  {
    id: "jeem", letter: "ج", name: "الجيم",
    makhraj: "وسط اللسان", makhrajDesc: "وسط اللسان مع ما يحاذيه من الحنك الأعلى.",
    sifaat: ["الجهر", "الشدة", "الاستفال", "الانفتاح", "الإصمات", "القلقلة"],
    tajweedRules: ["p", "a"]  // قلقلة + حرف إخفاء
  },
  {
    id: "haa_mudallaa", letter: "ح", name: "الحاء",
    makhraj: "وسط الحلق", makhrajDesc: "منطقة لسان المزمار.",
    sifaat: ["الهمس", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات"],
    tajweedRules: ["a"]  // حرف إخفاء بعض المذاهب
  },
  {
    id: "khaa", letter: "خ", name: "الخاء",
    makhraj: "أدنى الحلق", makhrajDesc: "أقرب جزء من الحلق إلى الفم (منطقة اللهاة).",
    sifaat: ["الهمس", "الرخاوة", "الاستعلاء", "الانفتاح", "الإصمات"],
    tajweedRules: ["a"]  // حرف إخفاء
  },
  {
    id: "daal", letter: "د", name: "الدال",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع أصول الثنايا العليا.",
    sifaat: ["الجهر", "الشدة", "الاستفال", "الانفتاح", "الإصمات", "القلقلة"],
    tajweedRules: ["p", "a", "l"]  // قلقلة + إخفاء + لام شمسية
  },
  {
    id: "thaal", letter: "ذ", name: "الذال",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع أطراف الثنايا العليا.",
    sifaat: ["الجهر", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات"],
    tajweedRules: ["a", "l"]  // إخفاء + لام شمسية
  },
  {
    id: "raa", letter: "ر", name: "الراء",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان (أديل إلى ظهره قليلاً) مع لثة الثنايا العليا.",
    sifaat: ["الجهر", "التوسط", "الاستفال", "الانفتاح", "الإذلاق", "الانحراف", "التكرير"],
    tajweedRules: ["u", "l"]  // إدغام بلا غنة + لام شمسية
  },
  {
    id: "zay", letter: "ز", name: "الزاي",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع ما فوق الثنايا السفلى (الصفير).",
    sifaat: ["الجهر", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات", "الصفير"],
    tajweedRules: ["a", "l"]  // إخفاء + لام شمسية
  },
  {
    id: "seen", letter: "س", name: "السين",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع ما فوق الثنايا السفلى.",
    sifaat: ["الهمس", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات", "الصفير"],
    tajweedRules: ["a", "l"]  // إخفاء + لام شمسية
  },
  {
    id: "sheen", letter: "ش", name: "الشين",
    makhraj: "وسط اللسان", makhrajDesc: "وسط اللسان مع ما يحاذيه من الحنك الأعلى.",
    sifaat: ["الهمس", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات", "التفشي"],
    tajweedRules: ["a", "l"]  // إخفاء + لام شمسية
  },
  {
    id: "saad", letter: "ص", name: "الصاد",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع ما فوق الثنايا السفلى.",
    sifaat: ["الهمس", "الرخاوة", "الاستعلاء", "الإطباق", "الإصمات", "الصفير"],
    tajweedRules: ["a", "l"]  // إخفاء + لام شمسية
  },
  {
    id: "daad", letter: "ض", name: "الضاد",
    makhraj: "حافة اللسان", makhrajDesc: "إحدى حافتي اللسان أو كلاهما مع ما يحاذيها من الأضراس العليا.",
    sifaat: ["الجهر", "الرخاوة", "الاستعلاء", "الإطباق", "الإصمات", "الاستطالة"],
    tajweedRules: ["a", "l"]  // إخفاء + لام شمسية
  },
  {
    id: "taa_mudhaffah", letter: "ط", name: "الطاء",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع أصول الثنايا العليا.",
    sifaat: ["الجهر", "الشدة", "الاستعلاء", "الإطباق", "الإصمات", "القلقلة"],
    tajweedRules: ["p", "a", "l"]  // قلقلة + إخفاء + لام شمسية
  },
  {
    id: "dhaa", letter: "ظ", name: "الظاء",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع أطراف الثنايا العليا.",
    sifaat: ["الجهر", "الرخاوة", "الاستعلاء", "الإطباق", "الإصمات"],
    tajweedRules: ["a", "l"]  // إخفاء + لام شمسية
  },
  {
    id: "ayn", letter: "ع", name: "العين",
    makhraj: "وسط الحلق", makhrajDesc: "منطقة لسان المزمار.",
    sifaat: ["الجهر", "التوسط", "الاستفال", "الانفتاح", "الإصمات"],
    tajweedRules: ["a"]  // حرف إخفاء
  },
  {
    id: "ghayn", letter: "غ", name: "الغين",
    makhraj: "أدنى الحلق", makhrajDesc: "أقرب جزء من الحلق إلى الفم.",
    sifaat: ["الجهر", "الرخاوة", "الاستعلاء", "الانفتاح", "الإصمات"],
    tajweedRules: ["a"]  // حرف إخفاء
  },
  {
    id: "faa", letter: "ف", name: "الفاء",
    makhraj: "الشفتان", makhrajDesc: "باطن الشفة السفلى مع أطراف الثنايا العليا.",
    sifaat: ["الهمس", "الرخاوة", "الاستفال", "الانفتاح", "الإذلاق"],
    tajweedRules: ["a"]  // حرف إخفاء
  },
  {
    id: "qaaf", letter: "ق", name: "القاف",
    makhraj: "أقصى اللسان", makhrajDesc: "أقصى اللسان مع ما يحاذيه من الحنك اللحمي (الرخو).",
    sifaat: ["الجهر", "الشدة", "الاستعلاء", "الانفتاح", "الإصمات", "القلقلة"],
    tajweedRules: ["p", "a"]  // قلقلة + إخفاء
  },
  {
    id: "kaaf", letter: "ك", name: "الكاف",
    makhraj: "أقصى اللسان", makhrajDesc: "أقصى اللسان مع الحنك اللحمي والعظمي معاً (أسفل مخرج القاف).",
    sifaat: ["الهمس", "الشدة", "الاستفال", "الانفتاح", "الإصمات"],
    tajweedRules: ["a"]  // حرف إخفاء
  },
  {
    id: "laam", letter: "ل", name: "اللام",
    makhraj: "حافة اللسان", makhrajDesc: "أدنى حافة اللسان إلى منتهاها مع ما يحاذيها من لثة الأسنان العليا.",
    sifaat: ["الجهر", "التوسط", "الاستفال", "الانفتاح", "الإذلاق", "الانحراف"],
    tajweedRules: ["u", "l"]  // إدغام بلا غنة + اللام نفسها شمسية
  },
  {
    id: "meem", letter: "م", name: "الميم",
    makhraj: "الشفتان", makhrajDesc: "بانطباق الشفتين (ويصاحبها غنة من الخيشوم).",
    sifaat: ["الجهر", "التوسط", "الاستفال", "الانفتاح", "الإذلاق", "الغنة"],
    tajweedRules: ["n", "i", "f"]  // غنة + إدغام بغنة + إخفاء شفوي
  },
  {
    id: "noon", letter: "ن", name: "النون",
    makhraj: "طرف اللسان", makhrajDesc: "طرف اللسان مع الدخول في ظهره قليلا وما يحاذيه من لثة الثنايا العليا (ويصاحبها غنة).",
    sifaat: ["الجهر", "التوسط", "الاستفال", "الانفتاح", "الإذلاق", "الغنة"],
    tajweedRules: ["n", "a", "u", "i", "q", "l"]  // غنة + إخفاء + إدغام بلا غنة + إدغام بغنة + إقلاب + لام شمسية
  },
  {
    id: "haa", letter: "هـ", name: "الهاء",
    makhraj: "أقصى الحلق", makhrajDesc: "أبعد جزء من الحلق.",
    sifaat: ["الهمس", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات", "الخفاء"],
    tajweedRules: ["a"]  // حرف إخفاء
  },
  {
    id: "waaw", letter: "و", name: "الواو (غير المدية)",
    makhraj: "الشفتان", makhrajDesc: "بانضمام الشفتين مع بقاء فرجة بينهما.",
    sifaat: ["الجهر", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات", "اللين"],
    tajweedRules: ["m", "o", "i"]  // مد + مد لازم + إدغام بغنة
  },
  {
    id: "yaa", letter: "ي", name: "الياء (غير المدية)",
    makhraj: "وسط اللسان", makhrajDesc: "وسط اللسان مع ما يحاذيه من الحنك الأعلى.",
    sifaat: ["الجهر", "الرخاوة", "الاستفال", "الانفتاح", "الإصمات", "اللين"],
    tajweedRules: ["m", "o", "i"]  // مد + مد لازم + إدغام بغنة
  },
];

export const getBaseArabicLetter = (grapheme: string): LetterData | null => {
  // Strip all diacritics and combining marks
  let base = grapheme.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
  base = base.replace(/ٱ/g, 'ا'); // Alif Waslah → Alif

  if (base === 'أ' || base === 'إ' || base === 'ؤ' || base === 'ئ' || base === 'ء') {
    return ARABIC_ALPHABET.find(a => a.id === 'hamza') || null;
  }
  if (base === 'آ') {
    return ARABIC_ALPHABET.find(a => a.id === 'alif') || null;
  }
  if (base === 'ة' || base === 'ه') {
    return ARABIC_ALPHABET.find(a => a.id === 'haa') || null;
  }
  if (base === 'ى' || base === 'ي') {
    return ARABIC_ALPHABET.find(a => a.id === 'yaa') || null;
  }

  const match = ARABIC_ALPHABET.find(a => a.letter === base);
  if (match) return match;

  return null;
};
