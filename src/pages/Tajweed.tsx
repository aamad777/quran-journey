import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuranExample {
  text: string;
  surah: string;
  ayah: string;
}

interface LetterInfo {
  letter: string;
  name: string;
  transliteration: string;
  articulationPoint: string;
  articulationArabic: string;
  category: string;
  categoryArabic: string;
  description: string;
  mouthPosition: string;
  tips: string[];
  color: string;
  examples: QuranExample[];
}

const LETTERS: LetterInfo[] = [
  {
    letter: "ا", name: "ألف", transliteration: "Alif",
    articulationPoint: "Throat (deepest)", articulationArabic: "أقصى الحلق",
    category: "throat", categoryArabic: "حروف حلقية",
    description: "الألف حرف مد يخرج من أقصى الحلق. وهو حرف ساكن مفتوح ما قبله.",
    mouthPosition: "يُفتح الفم بشكل طبيعي مع فتح الحلق. الهواء يخرج بحرية دون أي عائق.",
    tips: ["افتح فمك بشكل مريح", "لا تحرك اللسان", "الصوت يأتي من الحلق مباشرة"],
    color: "#e74c3c",
    examples: [
      { text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", surah: "الفاتحة", ayah: "٢" },
      { text: "الٓمٓ", surah: "البقرة", ayah: "١" },
    ]
  },
  {
    letter: "ب", name: "باء", transliteration: "Ba",
    articulationPoint: "Lips (both)", articulationArabic: "الشفتان معاً",
    category: "lips", categoryArabic: "حروف شفوية",
    description: "الباء تخرج من التقاء الشفتين. يُطبق الشفتان ثم ينفصلان مع خروج الهواء.",
    mouthPosition: "أغلق الشفتين تماماً ثم افتحهما بسرعة مع إخراج الصوت.",
    tips: ["اضغط الشفتين معاً بلطف", "افتحهما بسرعة", "الصوت يخرج مع فتح الشفتين"],
    color: "#3498db",
    examples: [
      { text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", surah: "الفاتحة", ayah: "١" },
      { text: "ذَٰلِكَ ٱلْكِتَابُ لَا رَيْبَ فِيهِ", surah: "البقرة", ayah: "٢" },
    ]
  },
  {
    letter: "ت", name: "تاء", transliteration: "Ta",
    articulationPoint: "Tongue tip + Upper teeth ridge", articulationArabic: "طرف اللسان مع أصول الثنايا العليا",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "التاء تخرج من طرف اللسان مع أصول الثنايا العليا (اللثة).",
    mouthPosition: "ضع طرف لسانك على اللثة خلف الأسنان العليا مباشرة، ثم أبعده بسرعة.",
    tips: ["طرف اللسان يلمس اللثة العليا", "انفصال سريع", "حرف مهموس بلا اهتزاز"],
    color: "#2ecc71",
    examples: [
      { text: "تَبَارَكَ ٱلَّذِي بِيَدِهِ ٱلْمُلْكُ", surah: "الملك", ayah: "١" },
      { text: "وَٱلتِّينِ وَٱلزَّيْتُونِ", surah: "التين", ayah: "١" },
    ]
  },
  {
    letter: "ث", name: "ثاء", transliteration: "Tha",
    articulationPoint: "Tongue tip + Upper teeth edge", articulationArabic: "طرف اللسان مع أطراف الثنايا العليا",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "الثاء تخرج بوضع طرف اللسان بين الأسنان العليا والسفلى مع خروج الهواء.",
    mouthPosition: "أخرج طرف لسانك قليلاً بين الأسنان وانفخ الهواء بلطف.",
    tips: ["اللسان بين الأسنان", "لا تعض على اللسان", "الهواء يخرج من الجانبين"],
    color: "#2ecc71",
    examples: [
      { text: "ثُمَّ أَنشَأْنَاهُ خَلْقًا آخَرَ", surah: "المؤمنون", ayah: "١٤" },
      { text: "فَإِذَا نُفِخَ فِي ٱلصُّورِ نَفْخَةٌ وَاحِدَةٌ", surah: "الحاقة", ayah: "١٣" },
    ]
  },
  {
    letter: "ج", name: "جيم", transliteration: "Jim",
    articulationPoint: "Middle tongue + Hard palate", articulationArabic: "وسط اللسان مع الحنك الأعلى",
    category: "tongue-middle", categoryArabic: "حروف لسانية (وسط)",
    description: "الجيم تخرج من وسط اللسان مع ما يحاذيه من الحنك الأعلى.",
    mouthPosition: "ارفع وسط اللسان للأعلى ليلامس سقف الحلق الصلب ثم أبعده.",
    tips: ["وسط اللسان يرتفع", "لمس سقف الفم", "انفصال مع صوت"],
    color: "#9b59b6",
    examples: [
      { text: "وَجَعَلْنَا مِنَ ٱلْمَاءِ كُلَّ شَيْءٍ حَيٍّ", surah: "الأنبياء", ayah: "٣٠" },
      { text: "إِنَّا جَعَلْنَاهُ قُرْآنًا عَرَبِيًّا", surah: "الزخرف", ayah: "٣" },
    ]
  },
  {
    letter: "ح", name: "حاء", transliteration: "Ha",
    articulationPoint: "Middle of throat", articulationArabic: "وسط الحلق",
    category: "throat", categoryArabic: "حروف حلقية",
    description: "الحاء تخرج من وسط الحلق. حرف مهموس يخرج بتضييق وسط الحلق.",
    mouthPosition: "ضيّق وسط الحلق وأخرج الهواء بهمس. مثل نفخ الهواء من الحلق.",
    tips: ["تضييق وسط الحلق", "همس بدون اهتزاز الحبال الصوتية", "مثل النفخ الخفيف"],
    color: "#e74c3c",
    examples: [
      { text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ", surah: "الإخلاص", ayah: "١" },
      { text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", surah: "الفاتحة", ayah: "٢" },
    ]
  },
  {
    letter: "خ", name: "خاء", transliteration: "Kha",
    articulationPoint: "Back tongue + Soft palate", articulationArabic: "أدنى الحلق مع اللهاة",
    category: "throat", categoryArabic: "حروف حلقية",
    description: "الخاء تخرج من أدنى الحلق (أقربه إلى الفم). حرف مهموس مستعلٍ.",
    mouthPosition: "ارفع مؤخرة اللسان نحو سقف الحلق الرخو مع تضييق المجرى.",
    tips: ["مؤخرة اللسان ترتفع", "الهواء يحتك بسقف الحلق", "صوت احتكاكي مهموس"],
    color: "#e74c3c",
    examples: [
      { text: "خَتَمَ ٱللَّهُ عَلَىٰ قُلُوبِهِمْ", surah: "البقرة", ayah: "٧" },
      { text: "خَلَقَ ٱلْإِنسَانَ مِنْ عَلَقٍ", surah: "العلق", ayah: "٢" },
    ]
  },
  {
    letter: "د", name: "دال", transliteration: "Dal",
    articulationPoint: "Tongue tip + Upper teeth ridge", articulationArabic: "طرف اللسان مع أصول الثنايا العليا",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "الدال تخرج من طرف اللسان مع أصول الثنايا العليا. مثل التاء لكنها مجهورة.",
    mouthPosition: "ضع طرف لسانك على اللثة العليا واضغط ثم حرره مع صوت.",
    tips: ["نفس مخرج التاء", "لكن مع اهتزاز الحبال الصوتية", "حرف مجهور"],
    color: "#2ecc71",
    examples: [
      { text: "ذَٰلِكَ ٱلْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ", surah: "البقرة", ayah: "٢" },
      { text: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ", surah: "الناس", ayah: "١" },
    ]
  },
  {
    letter: "ذ", name: "ذال", transliteration: "Dhal",
    articulationPoint: "Tongue tip + Upper teeth edge", articulationArabic: "طرف اللسان مع أطراف الثنايا العليا",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "الذال تخرج من طرف اللسان مع أطراف الثنايا العليا. مثل الثاء لكنها مجهورة.",
    mouthPosition: "أخرج طرف لسانك بين الأسنان مع اهتزاز الحبال الصوتية.",
    tips: ["نفس وضع الثاء", "لكن مع جهر (اهتزاز)", "اللسان بين الأسنان"],
    color: "#2ecc71",
    examples: [
      { text: "ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ", surah: "البقرة", ayah: "٣" },
      { text: "وَذَكِّرْ فَإِنَّ ٱلذِّكْرَىٰ تَنفَعُ ٱلْمُؤْمِنِينَ", surah: "الذاريات", ayah: "٥٥" },
    ]
  },
  {
    letter: "ر", name: "راء", transliteration: "Ra",
    articulationPoint: "Tongue tip + Upper gum", articulationArabic: "طرف اللسان مع ظهره قريباً من اللثة",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "الراء تخرج من طرف اللسان مائلاً إلى ظهره مع ما يحاذيه من اللثة. حرف متكرر.",
    mouthPosition: "ارفع طرف لسانك للأعلى قرب اللثة واجعله يرتعش مرة واحدة.",
    tips: ["طرف اللسان يرتعش", "قريب من سقف الفم الأمامي", "حرف تكراري مجهور"],
    color: "#2ecc71",
    examples: [
      { text: "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", surah: "الفاتحة", ayah: "٣" },
      { text: "رَبِّ ٱشْرَحْ لِي صَدْرِي", surah: "طه", ayah: "٢٥" },
    ]
  },
  {
    letter: "ز", name: "زاي", transliteration: "Za",
    articulationPoint: "Tongue tip + Lower teeth edge", articulationArabic: "طرف اللسان مع أطراف الثنايا السفلى",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "الزاي تخرج من طرف اللسان مع ما يحاذيه من أطراف الثنايا السفلى والعليا.",
    mouthPosition: "ضع طرف لسانك خلف الأسنان السفلية مع تقريب الأسنان وأخرج الهواء.",
    tips: ["الأسنان متقاربة", "الهواء يخرج بصفير", "حرف مجهور"],
    color: "#2ecc71",
    examples: [
      { text: "وَلَا تَحْسَبَنَّ ٱللَّهَ غَافِلًا", surah: "إبراهيم", ayah: "٤٢" },
      { text: "فَفَزِعَ مَن فِي ٱلسَّمَاوَاتِ", surah: "النمل", ayah: "٨٧" },
    ]
  },
  {
    letter: "س", name: "سين", transliteration: "Sin",
    articulationPoint: "Tongue tip + Lower teeth", articulationArabic: "طرف اللسان مع الثنايا السفلى",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "السين تخرج من طرف اللسان والثنايا السفلى. حرف صفيري مهموس.",
    mouthPosition: "ضع طرف لسانك خلف الأسنان السفلية وأخرج الهواء بصفير خفيف.",
    tips: ["صفير واضح", "الأسنان متقاربة جداً", "حرف مهموس بلا اهتزاز"],
    color: "#2ecc71",
    examples: [
      { text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", surah: "الفاتحة", ayah: "١" },
      { text: "سُبْحَانَ ٱلَّذِي أَسْرَىٰ بِعَبْدِهِ", surah: "الإسراء", ayah: "١" },
    ]
  },
  {
    letter: "ش", name: "شين", transliteration: "Shin",
    articulationPoint: "Middle tongue + Hard palate", articulationArabic: "وسط اللسان مع الحنك الأعلى",
    category: "tongue-middle", categoryArabic: "حروف لسانية (وسط)",
    description: "الشين تخرج من وسط اللسان مع ما يحاذيه من الحنك الأعلى. حرف مهموس متفشٍّ.",
    mouthPosition: "ارفع وسط لسانك نحو سقف الفم مع ترك فراغ لخروج الهواء المنتشر.",
    tips: ["الهواء ينتشر في الفم", "وسط اللسان مرتفع", "حرف تفشٍّ"],
    color: "#9b59b6",
    examples: [
      { text: "وَٱلشَّمْسِ وَضُحَاهَا", surah: "الشمس", ayah: "١" },
      { text: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ مِن شَرِّ ٱلْوَسْوَاسِ", surah: "الناس", ayah: "١-٤" },
    ]
  },
  {
    letter: "ص", name: "صاد", transliteration: "Sad",
    articulationPoint: "Tongue tip + Lower teeth (with elevation)", articulationArabic: "طرف اللسان مع الثنايا السفلى مع استعلاء",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "الصاد مثل السين في المخرج لكن مع استعلاء اللسان وإطباقه على سقف الحلق.",
    mouthPosition: "نفس وضع السين لكن ارفع مؤخرة لسانك نحو سقف الحلق لإعطاء التفخيم.",
    tips: ["مثل السين + تفخيم", "مؤخرة اللسان مرتفعة", "صوت مفخّم ثقيل"],
    color: "#e67e22",
    examples: [
      { text: "صِرَاطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ", surah: "الفاتحة", ayah: "٧" },
      { text: "وَٱلصَّافَّاتِ صَفًّا", surah: "الصافات", ayah: "١" },
    ]
  },
  {
    letter: "ض", name: "ضاد", transliteration: "Dad",
    articulationPoint: "Tongue side + Upper molars", articulationArabic: "حافة اللسان مع الأضراس العليا",
    category: "tongue-side", categoryArabic: "حروف لسانية (حافة)",
    description: "الضاد تخرج من حافة اللسان (إحدى الجهتين أو كلتيهما) مع الأضراس العليا. أصعب الحروف.",
    mouthPosition: "اضغط حافة لسانك على الأضراس العليا من أحد الجانبين أو كليهما.",
    tips: ["حرف فريد في العربية", "حافة اللسان تلمس الأضراس", "حرف مفخّم مستطيل"],
    color: "#e67e22",
    examples: [
      { text: "وَٱلضُّحَىٰ", surah: "الضحى", ayah: "١" },
      { text: "وَلَا ٱلضَّالِّينَ", surah: "الفاتحة", ayah: "٧" },
    ]
  },
  {
    letter: "ط", name: "طاء", transliteration: "Ta (emphatic)",
    articulationPoint: "Tongue tip + Upper teeth ridge (with elevation)", articulationArabic: "طرف اللسان مع أصول الثنايا العليا مع استعلاء",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "الطاء مثل التاء في المخرج لكن مع استعلاء وإطباق. حرف مفخّم.",
    mouthPosition: "نفس وضع التاء لكن ارفع مؤخرة لسانك نحو سقف الحلق.",
    tips: ["مثل التاء + تفخيم", "استعلاء مؤخرة اللسان", "صوت قوي مفخّم"],
    color: "#e67e22",
    examples: [
      { text: "طه", surah: "طه", ayah: "١" },
      { text: "وَلَقَدْ مَنَنَّا عَلَىٰ مُوسَىٰ وَهَارُونَ", surah: "الصافات", ayah: "١١٤" },
    ]
  },
  {
    letter: "ظ", name: "ظاء", transliteration: "Dha (emphatic)",
    articulationPoint: "Tongue tip + Upper teeth edge (with elevation)", articulationArabic: "طرف اللسان مع أطراف الثنايا العليا مع استعلاء",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "الظاء مثل الذال في المخرج لكن مع استعلاء وإطباق. حرف مفخّم.",
    mouthPosition: "أخرج طرف لسانك بين الأسنان مع رفع مؤخرة اللسان للتفخيم.",
    tips: ["مثل الذال + تفخيم", "اللسان بين الأسنان مع استعلاء", "صوت مفخّم"],
    color: "#e67e22",
    examples: [
      { text: "إِنَّ ٱلَّذِينَ ظَلَمُوا", surah: "يونس", ayah: "١٣" },
      { text: "وَظَلَّلْنَا عَلَيْكُمُ ٱلْغَمَامَ", surah: "البقرة", ayah: "٥٧" },
    ]
  },
  {
    letter: "ع", name: "عين", transliteration: "Ain",
    articulationPoint: "Middle of throat", articulationArabic: "وسط الحلق",
    category: "throat", categoryArabic: "حروف حلقية",
    description: "العين تخرج من وسط الحلق. حرف مجهور يخرج بتضييق وسط الحلق مع اهتزاز.",
    mouthPosition: "ضيّق وسط الحلق مع جعل الحبال الصوتية تهتز. مثل الحاء لكن مجهور.",
    tips: ["وسط الحلق يضيق", "مع اهتزاز (جهر)", "مثل الحاء المجهورة"],
    color: "#e74c3c",
    examples: [
      { text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", surah: "الفاتحة", ayah: "٥" },
      { text: "عَمَّ يَتَسَاءَلُونَ", surah: "النبأ", ayah: "١" },
    ]
  },
  {
    letter: "غ", name: "غين", transliteration: "Ghain",
    articulationPoint: "Top of throat near mouth", articulationArabic: "أدنى الحلق",
    category: "throat", categoryArabic: "حروف حلقية",
    description: "الغين تخرج من أدنى الحلق (أقربه للفم). مثل الخاء لكنها مجهورة.",
    mouthPosition: "ارفع مؤخرة اللسان نحو سقف الحلق الرخو مع اهتزاز الحبال الصوتية.",
    tips: ["مثل الخاء المجهورة", "غرغرة خفيفة", "مؤخرة اللسان مرتفعة"],
    color: "#e74c3c",
    examples: [
      { text: "غَافِرِ ٱلذَّنبِ وَقَابِلِ ٱلتَّوْبِ", surah: "غافر", ayah: "٣" },
      { text: "ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ", surah: "البقرة", ayah: "٣" },
    ]
  },
  {
    letter: "ف", name: "فاء", transliteration: "Fa",
    articulationPoint: "Lower lip + Upper teeth", articulationArabic: "الشفة السفلى مع أطراف الثنايا العليا",
    category: "lips", categoryArabic: "حروف شفوية",
    description: "الفاء تخرج من باطن الشفة السفلى مع أطراف الثنايا العليا.",
    mouthPosition: "ضع أسنانك العليا على شفتك السفلى بلطف وأخرج الهواء.",
    tips: ["الأسنان العليا على الشفة السفلى", "هواء يخرج بينهما", "حرف مهموس احتكاكي"],
    color: "#3498db",
    examples: [
      { text: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ", surah: "الفلق", ayah: "١" },
      { text: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ", surah: "الرحمن", ayah: "١٣" },
    ]
  },
  {
    letter: "ق", name: "قاف", transliteration: "Qaf",
    articulationPoint: "Back tongue + Soft palate", articulationArabic: "أقصى اللسان مع الحنك اللحمي",
    category: "tongue-back", categoryArabic: "حروف لسانية (أقصى)",
    description: "القاف تخرج من أقصى اللسان (أبعده عن الفم) مع ما يحاذيه من الحنك اللحمي.",
    mouthPosition: "ارفع أقصى اللسان ليلامس سقف الحلق الرخو ثم أبعده بسرعة.",
    tips: ["أقصى اللسان يرتفع", "يلامس اللهاة", "حرف مفخّم قوي"],
    color: "#f39c12",
    examples: [
      { text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ", surah: "الإخلاص", ayah: "١" },
      { text: "ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِي خَلَقَ", surah: "العلق", ayah: "١" },
    ]
  },
  {
    letter: "ك", name: "كاف", transliteration: "Kaf",
    articulationPoint: "Back tongue + Hard palate", articulationArabic: "أقصى اللسان مع الحنك الأعلى",
    category: "tongue-back", categoryArabic: "حروف لسانية (أقصى)",
    description: "الكاف تخرج من أقصى اللسان مع ما فوقه من الحنك الأعلى. أمام مخرج القاف.",
    mouthPosition: "ارفع مؤخرة اللسان ليلامس سقف الحلق الصلب ثم أبعده.",
    tips: ["أمام مخرج القاف قليلاً", "سقف الحلق الصلب", "حرف مهموس"],
    color: "#f39c12",
    examples: [
      { text: "قُلْ يَا أَيُّهَا ٱلْكَافِرُونَ", surah: "الكافرون", ayah: "١" },
      { text: "إِنَّا أَعْطَيْنَاكَ ٱلْكَوْثَرَ", surah: "الكوثر", ayah: "١" },
    ]
  },
  {
    letter: "ل", name: "لام", transliteration: "Lam",
    articulationPoint: "Tongue tip + Upper gum", articulationArabic: "أدنى حافة اللسان مع اللثة العليا",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "اللام تخرج من أدنى حافة اللسان إلى منتهاها مع ما يحاذيها من اللثة العليا.",
    mouthPosition: "ضع طرف لسانك وحافتيه على اللثة العليا والهواء يخرج من الجانبين.",
    tips: ["طرف اللسان على اللثة", "الهواء يمر من الجانبين", "حرف جانبي منحرف"],
    color: "#2ecc71",
    examples: [
      { text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ", surah: "الإخلاص", ayah: "١" },
      { text: "لَا إِلَٰهَ إِلَّا ٱللَّهُ", surah: "محمد", ayah: "١٩" },
    ]
  },
  {
    letter: "م", name: "ميم", transliteration: "Mim",
    articulationPoint: "Lips (both)", articulationArabic: "الشفتان معاً",
    category: "lips", categoryArabic: "حروف شفوية",
    description: "الميم تخرج من الشفتين مع انطباقهما. الهواء يخرج من الأنف.",
    mouthPosition: "أغلق الشفتين والهواء يخرج من الأنف مع غنّة.",
    tips: ["الشفتان مغلقتان", "الهواء من الأنف", "غنّة واضحة"],
    color: "#3498db",
    examples: [
      { text: "مَالِكِ يَوْمِ ٱلدِّينِ", surah: "الفاتحة", ayah: "٤" },
      { text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", surah: "الفاتحة", ayah: "١" },
    ]
  },
  {
    letter: "ن", name: "نون", transliteration: "Nun",
    articulationPoint: "Tongue tip + Upper gum", articulationArabic: "طرف اللسان مع اللثة العليا",
    category: "tongue-tip", categoryArabic: "حروف لسانية (طرف)",
    description: "النون تخرج من طرف اللسان مع ما يحاذيه من اللثة العليا. فيها غنّة من الأنف.",
    mouthPosition: "ضع طرف لسانك على اللثة العليا والهواء يخرج من الأنف.",
    tips: ["طرف اللسان على اللثة", "غنّة من الأنف", "مثل اللام لكن أنفي"],
    color: "#2ecc71",
    examples: [
      { text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", surah: "الفاتحة", ayah: "٥" },
      { text: "وَٱلنَّازِعَاتِ غَرْقًا", surah: "النازعات", ayah: "١" },
    ]
  },
  {
    letter: "هـ", name: "هاء", transliteration: "Ha (soft)",
    articulationPoint: "Deepest throat", articulationArabic: "أقصى الحلق",
    category: "throat", categoryArabic: "حروف حلقية",
    description: "الهاء تخرج من أقصى الحلق (أبعد نقطة). حرف مهموس خفيف.",
    mouthPosition: "أخرج نفساً خفيفاً من أعمق نقطة في الحلق بلا ضغط.",
    tips: ["أبعد نقطة في الحلق", "نفس خفيف بلا ضغط", "حرف مهموس رخو"],
    color: "#e74c3c",
    examples: [
      { text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ", surah: "الإخلاص", ayah: "١" },
      { text: "ٱهْدِنَا ٱلصِّرَاطَ ٱلْمُسْتَقِيمَ", surah: "الفاتحة", ayah: "٦" },
    ]
  },
  {
    letter: "و", name: "واو", transliteration: "Waw",
    articulationPoint: "Lips (rounded)", articulationArabic: "الشفتان مع ضمهما",
    category: "lips", categoryArabic: "حروف شفوية",
    description: "الواو تخرج من ضم الشفتين مع امتدادهما إلى الأمام.",
    mouthPosition: "ضم شفتيك للأمام كأنك تنفخ شمعة واصدر الصوت.",
    tips: ["الشفتان مضمومتان ممتدتان", "شكل دائري", "حرف مد ولين"],
    color: "#3498db",
    examples: [
      { text: "وَٱلْعَصْرِ", surah: "العصر", ayah: "١" },
      { text: "وَمَا أَدْرَاكَ مَا يَوْمُ ٱلدِّينِ", surah: "الانفطار", ayah: "١٧" },
    ]
  },
  {
    letter: "ي", name: "ياء", transliteration: "Ya",
    articulationPoint: "Middle tongue + Hard palate", articulationArabic: "وسط اللسان مع الحنك الأعلى",
    category: "tongue-middle", categoryArabic: "حروف لسانية (وسط)",
    description: "الياء تخرج من وسط اللسان مع ما يحاذيه من الحنك الأعلى.",
    mouthPosition: "ارفع وسط اللسان نحو سقف الفم مع مد الشفتين أفقياً.",
    tips: ["وسط اللسان مرتفع", "الشفتان ممتدتان أفقياً", "حرف مد ولين"],
    color: "#9b59b6",
    examples: [
      { text: "يس", surah: "يس", ayah: "١" },
      { text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", surah: "الفاتحة", ayah: "٥" },
    ]
  },
  {
    letter: "ء", name: "همزة", transliteration: "Hamza",
    articulationPoint: "Deepest throat (glottis)", articulationArabic: "أقصى الحلق (المزمار)",
    category: "throat", categoryArabic: "حروف حلقية",
    description: "الهمزة تخرج من أقصى الحلق من المزمار. تنتج بإغلاق الحبال الصوتية ثم فتحها فجأة.",
    mouthPosition: "أغلق الحبال الصوتية في الحلق تماماً ثم افتحها بسرعة.",
    tips: ["إغلاق ثم فتح مفاجئ", "أعمق نقطة في الحلق", "مثل الكحة الخفيفة"],
    color: "#e74c3c",
    examples: [
      { text: "ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِي خَلَقَ", surah: "العلق", ayah: "١" },
      { text: "إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ ٱلْقَدْرِ", surah: "القدر", ayah: "١" },
    ]
  },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  throat: { label: "حروف حلقية", icon: "🫁" },
  lips: { label: "حروف شفوية", icon: "👄" },
  "tongue-tip": { label: "حروف لسانية (طرف)", icon: "👅" },
  "tongue-middle": { label: "حروف لسانية (وسط)", icon: "👅" },
  "tongue-back": { label: "حروف لسانية (أقصى)", icon: "👅" },
  "tongue-side": { label: "حروف لسانية (حافة)", icon: "👅" },
};

const CATEGORY_ORDER = ["throat", "lips", "tongue-tip", "tongue-middle", "tongue-back", "tongue-side"];

// SVG mouth diagram component
const MouthDiagram = ({ category, letter }: { category: string; letter: string }) => {
  const getHighlight = () => {
    switch (category) {
      case "throat":
        return (
          <>
            <ellipse cx="150" cy="220" rx="22" ry="30" fill="rgba(231,76,60,0.3)" stroke="#e74c3c" strokeWidth="2" />
            <text x="150" y="225" textAnchor="middle" fill="#e74c3c" fontSize="10" fontWeight="bold">الحلق</text>
          </>
        );
      case "lips":
        return (
          <>
            <path d="M 100 95 Q 150 75 200 95" fill="none" stroke="#3498db" strokeWidth="4" />
            <path d="M 100 105 Q 150 125 200 105" fill="none" stroke="#3498db" strokeWidth="4" />
            <text x="150" y="68" textAnchor="middle" fill="#3498db" fontSize="10" fontWeight="bold">الشفتان</text>
          </>
        );
      case "tongue-tip":
        return (
          <>
            <circle cx="165" cy="135" r="10" fill="rgba(46,204,113,0.3)" stroke="#2ecc71" strokeWidth="2" />
            <text x="195" y="130" textAnchor="start" fill="#2ecc71" fontSize="10" fontWeight="bold">طرف اللسان</text>
          </>
        );
      case "tongue-middle":
        return (
          <>
            <ellipse cx="145" cy="155" rx="15" ry="10" fill="rgba(155,89,182,0.3)" stroke="#9b59b6" strokeWidth="2" />
            <text x="175" y="158" textAnchor="start" fill="#9b59b6" fontSize="10" fontWeight="bold">وسط اللسان</text>
          </>
        );
      case "tongue-back":
        return (
          <>
            <ellipse cx="120" cy="170" rx="15" ry="12" fill="rgba(243,156,18,0.3)" stroke="#f39c12" strokeWidth="2" />
            <text x="90" y="192" textAnchor="middle" fill="#f39c12" fontSize="10" fontWeight="bold">أقصى اللسان</text>
          </>
        );
      case "tongue-side":
        return (
          <>
            <path d="M 130 145 Q 145 160 160 145" fill="rgba(230,126,34,0.3)" stroke="#e67e22" strokeWidth="2" />
            <text x="145" y="175" textAnchor="middle" fill="#e67e22" fontSize="10" fontWeight="bold">حافة اللسان</text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto">
      {/* Head outline - side profile */}
      <path d="M 80 40 Q 60 40 50 60 Q 35 90 40 120 Q 42 140 50 155 Q 55 165 60 175 Q 55 190 55 210 Q 55 240 70 260 Q 85 275 110 280 L 200 280 Q 220 275 230 260 Q 240 240 240 210 Q 240 180 230 160 Q 225 150 220 140 Q 215 120 220 100 Q 225 80 220 60 Q 210 40 190 35 Q 170 30 150 32 Q 120 35 100 38 Z"
        fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />

      {/* Nasal cavity */}
      <path d="M 130 60 Q 140 55 155 60 Q 160 70 155 85 Q 145 90 135 85 Q 128 75 130 60"
        fill="hsl(var(--muted)/0.2)" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
      <text x="143" y="75" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="7" opacity="0.6">الأنف</text>

      {/* Upper lip */}
      <path d="M 95 95 Q 130 85 170 90 Q 190 92 200 98"
        fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.5" />
      {/* Lower lip */}
      <path d="M 95 105 Q 130 115 170 112 Q 190 108 200 102"
        fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.5" />

      {/* Teeth */}
      <line x1="170" y1="92" x2="170" y2="100" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
      <line x1="180" y1="93" x2="180" y2="100" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
      <line x1="170" y1="100" x2="170" y2="108" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />
      <line x1="180" y1="100" x2="180" y2="107" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />

      {/* Hard palate */}
      <path d="M 195 95 Q 180 70 150 68 Q 130 70 110 90"
        fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />

      {/* Soft palate / uvula */}
      <path d="M 110 90 Q 100 110 95 140 Q 93 160 100 175"
        fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.4" />

      {/* Tongue */}
      <path d="M 100 190 Q 115 170 135 155 Q 150 145 165 140 Q 175 138 185 140 Q 195 145 195 155 Q 190 170 175 180 Q 155 195 130 200 Q 110 200 100 190"
        fill="hsl(var(--destructive)/0.15)" stroke="hsl(var(--destructive))" strokeWidth="1.5" opacity="0.5" />

      {/* Throat area */}
      <path d="M 100 190 Q 110 210 120 230 Q 130 250 135 265"
        fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />
      <path d="M 175 180 Q 170 210 168 230 Q 165 250 165 265"
        fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.3" />

      {/* Highlight for current letter */}
      {getHighlight()}

      {/* Letter display */}
      <text x="150" y="30" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="22" fontFamily="'Amiri', serif" fontWeight="bold">{letter}</text>
    </svg>
  );
};

const Tajweed = () => {
  const navigate = useNavigate();
  const [selectedLetter, setSelectedLetter] = useState<LetterInfo | null>(null);
  const [playingLetter, setPlayingLetter] = useState<string | null>(null);

  const pronounceLetter = useCallback((letter: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.speechSynthesis.cancel();
    // Speak the letter with harakat for clarity, then the name
    const text = `${letter}. ${name}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.7;
    utterance.pitch = 1;
    // Try to find an Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
    if (arabicVoice) utterance.voice = arabicVoice;
    setPlayingLetter(letter);
    utterance.onend = () => setPlayingLetter(null);
    utterance.onerror = () => setPlayingLetter(null);
    window.speechSynthesis.speak(utterance);
  }, []);

  const grouped = CATEGORY_ORDER.map(cat => ({
    ...CATEGORY_LABELS[cat],
    category: cat,
    letters: LETTERS.filter(l => l.category === cat),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl border-b border-border bg-background/90">
        <div className="container max-w-4xl mx-auto flex items-center h-14 px-4 gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="font-arabic text-lg font-bold text-foreground">مخارج الحروف</h1>
          <span className="text-xs text-muted-foreground">تعلّم نطق كل حرف</span>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
        {grouped.map(group => (
          <section key={group.category}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{group.icon}</span>
              <h2 className="font-arabic text-base font-bold text-foreground">{group.label}</h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2">
              {group.letters.map(letter => (
                <button
                  key={letter.letter}
                  onClick={() => {
                    pronounceLetter(letter.letter, letter.name);
                    setSelectedLetter(letter);
                  }}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-card hover:shadow-lg hover:scale-105 transition-all duration-200 active:scale-95 ${playingLetter === letter.letter ? 'ring-2' : ''}`}
                  style={{ borderColor: `${letter.color}30`, ...(playingLetter === letter.letter ? { ringColor: letter.color } : {}) }}
                >
                  <Volume2 className="absolute top-1 left-1 w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: letter.color }} />
                  <span className="text-2xl font-arabic font-bold" style={{ color: letter.color }}>{letter.letter}</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">{letter.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Quick legend */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-arabic text-sm font-bold text-foreground mb-3">دليل الألوان</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORY_ORDER.map(cat => {
              const info = CATEGORY_LABELS[cat];
              const sample = LETTERS.find(l => l.category === cat);
              return (
                <div key={cat} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sample?.color }} />
                  <span className="text-xs text-muted-foreground font-arabic">{info.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Letter Detail Dialog */}
      <Dialog open={!!selectedLetter} onOpenChange={(open) => !open && setSelectedLetter(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          {selectedLetter && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4">
                  <span className="text-5xl font-arabic font-bold" style={{ color: selectedLetter.color }}>{selectedLetter.letter}</span>
                  <div>
                    <div className="text-lg font-arabic font-bold text-foreground">{selectedLetter.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedLetter.transliteration}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full mr-auto"
                    style={{ borderColor: `${selectedLetter.color}40`, color: selectedLetter.color }}
                    onClick={() => pronounceLetter(selectedLetter.letter, selectedLetter.name)}
                  >
                    <Volume2 className={`w-5 h-5 ${playingLetter === selectedLetter.letter ? 'animate-pulse' : ''}`} />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Mouth diagram */}
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <h4 className="font-arabic text-sm font-semibold text-foreground mb-2 text-center">موضع النطق</h4>
                  <MouthDiagram category={selectedLetter.category} letter={selectedLetter.letter} />
                </div>

                {/* Articulation point */}
                <div className="rounded-lg border p-3" style={{ borderColor: `${selectedLetter.color}30`, backgroundColor: `${selectedLetter.color}08` }}>
                  <div className="text-xs text-muted-foreground mb-1">المخرج</div>
                  <div className="font-arabic text-sm font-semibold" style={{ color: selectedLetter.color }}>{selectedLetter.articulationArabic}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{selectedLetter.articulationPoint}</div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-arabic text-sm font-semibold text-foreground mb-1">الوصف</h4>
                  <p className="text-sm text-muted-foreground font-arabic leading-relaxed">{selectedLetter.description}</p>
                </div>

                {/* How to position mouth */}
                <div className="rounded-lg border border-border bg-card p-3">
                  <h4 className="font-arabic text-sm font-semibold text-foreground mb-1">👄 كيف تنطقه</h4>
                  <p className="text-sm text-muted-foreground font-arabic leading-relaxed">{selectedLetter.mouthPosition}</p>
                </div>

                {/* Tips */}
                <div>
                  <h4 className="font-arabic text-sm font-semibold text-foreground mb-2">💡 نصائح</h4>
                  <ul className="space-y-1.5">
                    {selectedLetter.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-arabic">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: selectedLetter.color }} />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Category badge */}
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-arabic" style={{ backgroundColor: `${selectedLetter.color}15`, color: selectedLetter.color }}>
                    {CATEGORY_LABELS[selectedLetter.category]?.icon} {selectedLetter.categoryArabic}
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tajweed;
