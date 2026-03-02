import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Progress {
  surah_number: number;
  ayah_number: number;
}

const GUEST_PROGRESS_KEY = "quran_guest_progress";

// Total ayahs per surah (114 surahs)
const SURAH_AYAH_COUNT = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
  59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
  52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
  21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6
];

const getGuestProgress = (): Progress => {
  try {
    const saved = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { surah_number: 1, ayah_number: 1 };
};

const saveGuestProgress = (p: Progress) => {
  localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(p));
};

const calcNext = (progress: Progress): Progress => {
  let { surah_number, ayah_number } = progress;
  const maxAyah = SURAH_AYAH_COUNT[surah_number - 1];
  if (ayah_number < maxAyah) {
    ayah_number += 1;
  } else if (surah_number < 114) {
    surah_number += 1;
    ayah_number = 1;
  } else {
    surah_number = 1;
    ayah_number = 1;
  }
  return { surah_number, ayah_number };
};

const calcPrev = (progress: Progress): Progress => {
  let { surah_number, ayah_number } = progress;
  if (ayah_number > 1) {
    ayah_number -= 1;
  } else if (surah_number > 1) {
    surah_number -= 1;
    ayah_number = SURAH_AYAH_COUNT[surah_number - 1];
  }
  return { surah_number, ayah_number };
};

export const useQuranProgress = (user: User | null) => {
  const [progress, setProgress] = useState<Progress>({ surah_number: 1, ayah_number: 1 });
  const [loading, setLoading] = useState(true);

  // Load progress
  useEffect(() => {
    if (user) {
      // Authenticated: load from DB
      const loadProgress = async () => {
        const { data, error } = await supabase
          .from("user_progress")
          .select("surah_number, ayah_number")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setProgress({ surah_number: data.surah_number, ayah_number: data.ayah_number });
        } else if (!error || error.code === "PGRST116") {
          // Sync guest progress to DB on first login
          const guestProgress = getGuestProgress();
          await supabase.from("user_progress").upsert({
            user_id: user.id,
            ...guestProgress,
          }, { onConflict: "user_id" });
          setProgress(guestProgress);
        }
        setLoading(false);
      };
      loadProgress();
    } else {
      // Guest: load from localStorage
      setProgress(getGuestProgress());
      setLoading(false);
    }
  }, [user]);

  const goToNext = useCallback(async () => {
    const newProgress = calcNext(progress);
    setProgress(newProgress);

    if (user) {
      await supabase.from("user_progress").update(newProgress).eq("user_id", user.id);
    } else {
      saveGuestProgress(newProgress);
    }
  }, [user, progress]);

  const goToPrev = useCallback(async () => {
    const newProgress = calcPrev(progress);
    setProgress(newProgress);

    if (user) {
      await supabase.from("user_progress").update(newProgress).eq("user_id", user.id);
    } else {
      saveGuestProgress(newProgress);
    }
  }, [user, progress]);

  const goToSurah = useCallback(async (surahNumber: number) => {
    const newProgress = { surah_number: surahNumber, ayah_number: 1 };
    setProgress(newProgress);

    if (user) {
      await supabase.from("user_progress").update(newProgress).eq("user_id", user.id);
    } else {
      saveGuestProgress(newProgress);
    }
  }, [user]);

  return { progress, loading, goToNext, goToPrev, goToSurah };
};
