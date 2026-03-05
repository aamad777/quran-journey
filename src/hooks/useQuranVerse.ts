import { useState, useEffect } from "react";

interface VerseData {
  arabic: string;
  translation: string;
  surahName: string;
  surahNameArabic: string;
  revelationType: string;
}

const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy" },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais" },
  { id: "ar.huthayfi", name: "Ali Al-Huthayfi" },
  { id: "ar.minshawi", name: "Muhammad Al-Minshawi" },
  { id: "ar.ahmedajamy", name: "Ahmed Al-Ajamy" },
  { id: "ar.raaboralkurdi", name: "Raad Al-Kurdi" },
];

export const useQuranVerse = (surahNumber: number, ayahNumber: number) => {
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);

  useEffect(() => {
    const fetchVerse = async () => {
      setLoading(true);
      try {
        // Fetch Arabic + English translation
        const res = await fetch(
          `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/editions/quran-uthmani,en.sahih`
        );
        const data = await res.json();

        if (data.code === 200 && data.data) {
          const arabic = data.data[0];
          const english = data.data[1];
          setVerse({
            arabic: arabic.text,
            translation: english.text,
            surahName: arabic.surah.englishName,
            surahNameArabic: arabic.surah.name,
            revelationType: arabic.surah.revelationType,
          });
        }
      } catch (err) {
        console.error("Failed to fetch verse:", err);
      }
      setLoading(false);
    };

    fetchVerse();
  }, [surahNumber, ayahNumber]);

  // Update audio URL when reciter or verse changes
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

  return { verse, audioUrl, loading, selectedReciter, setSelectedReciter, reciters: RECITERS };
};
