import { useState, useEffect, useCallback } from "react";

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface NextPrayer {
  name: string;
  nameAr: string;
  time: string;
  remainingMs: number;
  remainingFormatted: string;
}

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

function parseTime(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
}

function formatRemaining(ms: number): string {
  if (ms < 0) return "";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h} س ${m} د`;
  return `${m} دقيقة`;
}

export const usePrayerTimes = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrayerTimes = useCallback(async (lat: number, lng: number) => {
    try {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=4`
      );
      const data = await res.json();
      if (data.code === 200 && data.data?.timings) {
        const t = data.data.timings as Record<string, string>;
        // Strip " (PKT)" or timezone suffixes
        const clean = (s: string) => s.replace(/\s*\(.*\)/, "");
        setPrayerTimes({
          Fajr: clean(t.Fajr),
          Sunrise: clean(t.Sunrise),
          Dhuhr: clean(t.Dhuhr),
          Asr: clean(t.Asr),
          Maghrib: clean(t.Maghrib),
          Isha: clean(t.Isha),
        });
      }
    } catch (err) {
      console.error("Failed to fetch prayer times:", err);
    }
    setLoading(false);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationGranted(false);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationGranted(true);
        localStorage.setItem("quran_lat", String(pos.coords.latitude));
        localStorage.setItem("quran_lng", String(pos.coords.longitude));
        fetchPrayerTimes(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocationGranted(false);
        setLoading(false);
      }
    );
  }, [fetchPrayerTimes]);

  // On mount, try cached location first
  useEffect(() => {
    const cachedLat = localStorage.getItem("quran_lat");
    const cachedLng = localStorage.getItem("quran_lng");
    if (cachedLat && cachedLng) {
      setLocationGranted(true);
      fetchPrayerTimes(parseFloat(cachedLat), parseFloat(cachedLng));
    } else {
      requestLocation();
    }
  }, [fetchPrayerTimes, requestLocation]);

  // Update next prayer every 30s
  useEffect(() => {
    if (!prayerTimes) return;

    const compute = () => {
      const now = new Date();
      for (const name of PRAYER_ORDER) {
        const time = prayerTimes[name as keyof PrayerTimes];
        const prayerDate = parseTime(time);
        const diff = prayerDate.getTime() - now.getTime();
        if (diff > 0) {
          setNextPrayer({
            name,
            nameAr: PRAYER_NAMES_AR[name],
            time,
            remainingMs: diff,
            remainingFormatted: formatRemaining(diff),
          });
          return;
        }
      }
      // All prayers passed — next is Fajr tomorrow
      const fajrTomorrow = parseTime(prayerTimes.Fajr);
      fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
      const diff = fajrTomorrow.getTime() - now.getTime();
      setNextPrayer({
        name: "Fajr",
        nameAr: "الفجر",
        time: prayerTimes.Fajr,
        remainingMs: diff,
        remainingFormatted: formatRemaining(diff),
      });
    };

    compute();
    const interval = setInterval(compute, 30000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  return { prayerTimes, nextPrayer, locationGranted, loading, requestLocation };
};
