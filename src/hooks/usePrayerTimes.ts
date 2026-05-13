import { useState, useEffect, useCallback, useRef } from "react";

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

export interface PrayerEntry {
  name: string;
  nameAr: string;
  time: string;
  iqamaTime: string;
  isNext: boolean;
  /** ms remaining until iqama (negative if passed) */
  iqamaRemainingMs: number;
  iqamaRemainingFormatted: string;
  /** ms remaining until adhan (negative if passed) */
  adhanRemainingMs: number;
}

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

// Only the 5 obligatory prayers get iqama
const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const IQAMA_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Default iqama offsets in minutes after adhan
const IQAMA_OFFSETS: Record<string, number> = {
  Fajr: 20,
  Dhuhr: 10,
  Asr: 10,
  Maghrib: 5,
  Isha: 10,
};

function parseTime(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
}

function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60_000);
}

function formatHM(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatRemaining(ms: number): string {
  if (ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export const usePrayerTimes = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [allPrayers, setAllPrayers] = useState<PrayerEntry[]>([]);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAdhan, setActiveAdhan] = useState<{ name: string; nameAr: string } | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    if (!prayerTimes) return;

    const compute = () => {
      const now = new Date();

      // Find next upcoming prayer (any of the 6 markers)
      let nextName: string | null = null;
      for (const name of PRAYER_ORDER) {
        const time = prayerTimes[name as keyof PrayerTimes];
        const diff = parseTime(time).getTime() - now.getTime();
        if (diff > 0) {
          nextName = name;
          setNextPrayer({
            name,
            nameAr: PRAYER_NAMES_AR[name],
            time,
            remainingMs: diff,
            remainingFormatted: formatRemaining(diff),
          });
          break;
        }
      }
      if (!nextName) {
        const fajrTomorrow = parseTime(prayerTimes.Fajr);
        fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
        const diff = fajrTomorrow.getTime() - now.getTime();
        nextName = "Fajr";
        setNextPrayer({
          name: "Fajr",
          nameAr: "الفجر",
          time: prayerTimes.Fajr,
          remainingMs: diff,
          remainingFormatted: formatRemaining(diff),
        });
      }

      // Build all prayer entries (5 obligatory only)
      const entries: PrayerEntry[] = IQAMA_PRAYERS.map((name) => {
        const time = prayerTimes[name as keyof PrayerTimes];
        const adhanDate = parseTime(time);
        const iqamaDate = addMinutes(adhanDate, IQAMA_OFFSETS[name] || 10);
        const adhanDiff = adhanDate.getTime() - now.getTime();
        const iqamaDiff = iqamaDate.getTime() - now.getTime();
        return {
          name,
          nameAr: PRAYER_NAMES_AR[name],
          time,
          iqamaTime: formatHM(iqamaDate),
          isNext: name === nextName,
          adhanRemainingMs: adhanDiff,
          iqamaRemainingMs: iqamaDiff,
          iqamaRemainingFormatted: formatRemaining(iqamaDiff),
        };
      });
      setAllPrayers(entries);

      // Trigger adhan popup when adhan time hits (within last 2 seconds)
      const todayKey = now.toISOString().slice(0, 10);
      for (const entry of entries) {
        const triggerKey = `${todayKey}_${entry.name}`;
        if (
          entry.adhanRemainingMs <= 0 &&
          entry.adhanRemainingMs > -2000 &&
          !triggeredRef.current.has(triggerKey)
        ) {
          triggeredRef.current.add(triggerKey);
          setActiveAdhan({ name: entry.name, nameAr: entry.nameAr });
        }
      }
    };

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const dismissAdhan = useCallback(() => setActiveAdhan(null), []);

  return {
    prayerTimes,
    nextPrayer,
    allPrayers,
    locationGranted,
    loading,
    requestLocation,
    activeAdhan,
    dismissAdhan,
  };
};
