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

const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais" },
  { id: "ar.huthayfi", name: "Ali Al-Huthayfi" },
  { id: "ar.minshawi", name: "Muhammad Al-Minshawi" },
  { id: "ar.ahmedajamy", name: "Ahmed Al-Ajamy" },
  { id: "ar.raaboralkurdi", name: "Raad Al-Kurdi" },
];

// Surah ayah counts for boundary checking
const SURAH_AYAH_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
  59,37,35,38,88,52,45,29,30,73,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
  52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
  21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6
];

export const useQuranVerse = (surahNumber: number, ayahNumber: number, verseCount: number = 1) => {
  const [verses, setVerses] = useState<VerseData[]>([]);
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

  // Audio for first verse
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const res = await fetch(
          `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/${selectedReciter}`
        );
        const data = await res.json();
        if (data.code === 200 && data.data?.audio) {
          setAudioUrl(data.data.audio);
        }
      } catch (err) {
        console.error("Failed to fetch audio:", err);
      }
    };

    fetchAudio();
  }, [surahNumber, ayahNumber, selectedReciter]);

  // Back-compat: expose first verse as `verse`
  const verse = verses.length > 0 ? verses[0] : null;

  return { verse, verses, audioUrl, loading, selectedReciter, setSelectedReciter, reciters: RECITERS };
};
