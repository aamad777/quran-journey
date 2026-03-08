import { useState, useEffect } from "react";

interface VerseData {
  arabic: string;
  tajweedText: string;
  surahName: string;
  surahNameArabic: string;
  revelationType: string;
  surahNumber: number;
  ayahNumber: number;
}

type ReciterSource =
  | { type: "alquran"; id: string }
  | { type: "everyayah"; folder: string }
  | { type: "mp3quran"; server: string; path: string };

interface Reciter {
  id: string;
  name: string;
  source: ReciterSource;
}

const RECITERS: Reciter[] = [
  // --- alquran.cloud reciters (verse-by-verse) ---
  { id: "ar.alafasy", name: "مشاري العفاسي", source: { type: "alquran", id: "ar.alafasy" } },
  { id: "ar.abdurrahmaansudais", name: "عبدالرحمن السديس", source: { type: "alquran", id: "ar.abdurrahmaansudais" } },
  { id: "ar.husary", name: "محمود خليل الحصري", source: { type: "alquran", id: "ar.husary" } },
  { id: "ar.husarymujawwad", name: "الحصري (مجوّد)", source: { type: "alquran", id: "ar.husarymujawwad" } },
  { id: "ar.abdulsamad", name: "عبدالباسط عبدالصمد", source: { type: "alquran", id: "ar.abdulsamad" } },
  { id: "ar.shaatree", name: "أبو بكر الشاطري", source: { type: "alquran", id: "ar.shaatree" } },
  { id: "ar.ahmedajamy", name: "أحمد بن علي العجمي", source: { type: "alquran", id: "ar.ahmedajamy" } },
  { id: "ar.hudhaify", name: "علي بن عبدالرحمن الحذيفي", source: { type: "alquran", id: "ar.hudhaify" } },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي", source: { type: "alquran", id: "ar.mahermuaiqly" } },
  { id: "ar.saoodshuraym", name: "سعود الشريم", source: { type: "alquran", id: "ar.saoodshuraym" } },
  { id: "ar.ibrahimakhbar", name: "إبراهيم الأخضر", source: { type: "alquran", id: "ar.ibrahimakhbar" } },
  { id: "ar.muhammadayyoub", name: "محمد أيوب", source: { type: "alquran", id: "ar.muhammadayyoub" } },
  { id: "ar.muhammadjibreel", name: "محمد جبريل", source: { type: "alquran", id: "ar.muhammadjibreel" } },
  { id: "ar.hanirifai", name: "هاني الرفاعي", source: { type: "alquran", id: "ar.hanirifai" } },
  { id: "ar.abdullahbasfar", name: "عبدالله بصفر", source: { type: "alquran", id: "ar.abdullahbasfar" } },
  { id: "ar.aymanswoaid", name: "أيمن سويد", source: { type: "alquran", id: "ar.aymanswoaid" } },
  { id: "ar.parhizgar", name: "شهريار پرهيزگار", source: { type: "alquran", id: "ar.parhizgar" } },
  // --- EveryAyah reciters (verse-by-verse) ---
  { id: "ea.nasser_alqatami", name: "ناصر القطامي", source: { type: "everyayah", folder: "Nasser_Alqatami_128kbps" } },
  { id: "ea.yasser_dussary", name: "ياسر الدوسري", source: { type: "everyayah", folder: "Yasser_Ad-Dussary_128kbps" } },
  { id: "ea.fares_abbad", name: "فارس عباد", source: { type: "everyayah", folder: "Fares_Abbad_64kbps" } },
  { id: "ea.salah_budair", name: "صلاح البدير", source: { type: "everyayah", folder: "Salah_Al_Budair_128kbps" } },
  { id: "ea.abdullah_matroud", name: "عبدالله المطرود", source: { type: "everyayah", folder: "Abdullah_Matroud_128kbps" } },
  { id: "ea.minshawy_murattal", name: "المنشاوي (مرتل)", source: { type: "everyayah", folder: "Minshawy_Murattal_128kbps" } },
  { id: "ea.minshawy_mujawwad", name: "المنشاوي (مجوّد)", source: { type: "everyayah", folder: "Minshawy_Mujawwad_192kbps" } },
  { id: "ea.ali_jaber", name: "علي جابر", source: { type: "everyayah", folder: "Ali_Jaber_64kbps" } },
  { id: "ea.khalefa_tunaiji", name: "خليفة الطنيجي", source: { type: "everyayah", folder: "khalefa_al_tunaiji_64kbps" } },
  { id: "ea.abdulbasit_mujawwad", name: "عبدالباسط (مجوّد)", source: { type: "everyayah", folder: "Abdul_Basit_Mujawwad_128kbps" } },
  { id: "ea.salaah_bukhatir", name: "صلاح بوخاطر", source: { type: "everyayah", folder: "Salaah_AbdulRahman_Bukhatir_128kbps" } },
  { id: "ea.muhsin_qasim", name: "محسن القاسم", source: { type: "everyayah", folder: "Muhsin_Al_Qasim_192kbps" } },
  { id: "ea.tablaway", name: "محمد الطبلاوي", source: { type: "everyayah", folder: "Mohammad_al_Tablaway_128kbps" } },
  { id: "ea.ghamadi", name: "سعد الغامدي", source: { type: "everyayah", folder: "Ghamadi_40kbps" } },
  // --- mp3quran.net reciters (surah-level audio) ---
  { id: "mp3.raad_kurdi", name: "رعد محمد الكردي", source: { type: "mp3quran", server: "https://server6.mp3quran.net", path: "kurdi" } },
];

// Surah ayah counts for boundary checking
const SURAH_AYAH_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
  59,37,35,38,88,52,45,29,30,73,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
  52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
  21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6
];

const pad3 = (n: number) => n.toString().padStart(3, "0");

const getReciterObj = (id: string) => RECITERS.find((r) => r.id === id) || RECITERS[0];

function buildAudioUrl(reciter: Reciter, surah: number, ayah: number): string | null {
  const src = reciter.source;
  switch (src.type) {
    case "alquran":
      return null; // needs API fetch
    case "everyayah":
      return `https://everyayah.com/data/${src.folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
    case "mp3quran":
      // surah-level only
      return `${src.server}/${src.path}/${pad3(surah)}.mp3`;
    default:
      return null;
  }
}

export const useQuranVerse = (surahNumber: number, ayahNumber: number, verseCount: number = 1) => {
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);

  // Build list of verse references to fetch
  const getVerseRefs = (surah: number, ayah: number, count: number) => {
    const refs: { surah: number; ayah: number }[] = [];
    let s = surah;
    let a = ayah;
    for (let i = 0; i < count; i++) {
      if (s > 114) break;
      refs.push({ surah: s, ayah: a });
      a++;
      if (a > (SURAH_AYAH_COUNTS[s - 1] || 999)) {
        s++;
        a = 1;
      }
    }
    return refs;
  };

  useEffect(() => {
    const fetchVerses = async () => {
      setLoading(true);
      try {
        const refs = getVerseRefs(surahNumber, ayahNumber, verseCount);
        const fetches = refs.map(async (ref) => {
          const [res, tajRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/ayah/${ref.surah}:${ref.ayah}/quran-uthmani`),
            fetch(`https://api.alquran.cloud/v1/ayah/${ref.surah}:${ref.ayah}/editions/quran-tajweed`),
          ]);
          const data = await res.json();
          const tajData = await tajRes.json();
          if (data.code === 200 && data.data) {
            const arabic = data.data;
            const tajweedText = tajData.code === 200 && tajData.data?.[0]?.text ? tajData.data[0].text : "";
            return {
              arabic: arabic.text,
              tajweedText,
              surahName: arabic.surah.englishName,
              surahNameArabic: arabic.surah.name,
              revelationType: arabic.surah.revelationType,
              surahNumber: ref.surah,
              ayahNumber: ref.ayah,
            } as VerseData;
          }
          return null;
        });
        const results = await Promise.all(fetches);
        setVerses(results.filter(Boolean) as VerseData[]);
      } catch (err) {
        console.error("Failed to fetch verses:", err);
      }
      setLoading(false);
    };

    fetchVerses();
  }, [surahNumber, ayahNumber, verseCount]);

  // Audio for all verses
  useEffect(() => {
    const fetchAllAudio = async () => {
      try {
        const reciter = getReciterObj(selectedReciter);
        const refs = getVerseRefs(surahNumber, ayahNumber, verseCount);

        if (reciter.source.type === "alquran") {
          // Use API to get audio URLs
          const urls = await Promise.all(
            refs.map(async (ref) => {
              const res = await fetch(
                `https://api.alquran.cloud/v1/ayah/${ref.surah}:${ref.ayah}/${reciter.source.type === "alquran" ? (reciter.source as any).id : ""}`
              );
              const data = await res.json();
              return data.code === 200 && data.data?.audio ? data.data.audio : "";
            })
          );
          setAudioUrls(urls.filter(Boolean));
          setAudioUrl(urls[0] || "");
        } else if (reciter.source.type === "everyayah") {
          // Direct URL construction
          const urls = refs.map((ref) => buildAudioUrl(reciter, ref.surah, ref.ayah)!);
          setAudioUrls(urls);
          setAudioUrl(urls[0] || "");
        } else if (reciter.source.type === "mp3quran") {
          // Surah-level: same URL for all verses in same surah
          const urls = refs.map((ref) => buildAudioUrl(reciter, ref.surah, ref.ayah)!);
          setAudioUrls(urls);
          setAudioUrl(urls[0] || "");
        }
      } catch (err) {
        console.error("Failed to fetch audio:", err);
      }
    };

    fetchAllAudio();
  }, [surahNumber, ayahNumber, selectedReciter, verseCount]);

  // Back-compat: expose first verse as `verse`
  const verse = verses.length > 0 ? verses[0] : null;
  const currentReciter = getReciterObj(selectedReciter);
  const isSurahLevel = currentReciter.source.type === "mp3quran";

  return { verse, verses, audioUrl, audioUrls, loading, selectedReciter, setSelectedReciter, reciters: RECITERS, isSurahLevel };
};
