import { useEffect, useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Gamification: daily streak, daily goal, achievements.
 * All state in localStorage under `quran_gami_*`.
 */

const K_STREAK = "quran_gami_streak";           // number
const K_LAST_DAY = "quran_gami_last_day";       // ISO YYYY-MM-DD
const K_BEST_STREAK = "quran_gami_best_streak"; // number
const K_TODAY_COUNT = "quran_gami_today_count"; // number
const K_TODAY_DAY = "quran_gami_today_day";     // ISO
const K_GOAL = "quran_gami_daily_goal";         // number, default 10
const K_TOTAL = "quran_gami_total_verses";      // number
const K_PRACTICE = "quran_gami_practice_sessions"; // number
const K_ACHIEVEMENTS = "quran_gami_achievements";  // JSON string[] of unlocked ids

const isoDay = (d = new Date()) => d.toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

const getNum = (k: string, dflt = 0) => {
  try { return parseInt(localStorage.getItem(k) || String(dflt)); } catch { return dflt; }
};
const setNum = (k: string, v: number) => {
  try { localStorage.setItem(k, String(v)); } catch {}
};

export interface Achievement {
  id: string;
  labelAr: string;
  descAr: string;
  emoji: string;
  check: (s: GamiState) => boolean;
}

export interface GamiState {
  streak: number;
  bestStreak: number;
  todayCount: number;
  dailyGoal: number;
  totalVerses: number;
  practiceSessions: number;
  achievements: string[];
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_verse", labelAr: "الخطوة الأولى", descAr: "قرأت أول آية", emoji: "🌱", check: (s) => s.totalVerses >= 1 },
  { id: "verses_100", labelAr: "قارئ مثابر", descAr: "قرأت ١٠٠ آية", emoji: "📖", check: (s) => s.totalVerses >= 100 },
  { id: "verses_500", labelAr: "محب للقرآن", descAr: "قرأت ٥٠٠ آية", emoji: "🌟", check: (s) => s.totalVerses >= 500 },
  { id: "streak_7", labelAr: "أسبوع كامل", descAr: "٧ أيام متتالية", emoji: "🔥", check: (s) => s.bestStreak >= 7 },
  { id: "streak_30", labelAr: "شهر من العطاء", descAr: "٣٠ يوماً متتالياً", emoji: "🏆", check: (s) => s.bestStreak >= 30 },
  { id: "practice_10", labelAr: "متمرّن", descAr: "١٠ جلسات تدريب صوتي", emoji: "🎙️", check: (s) => s.practiceSessions >= 10 },
  { id: "goal_hit", labelAr: "هدف اليوم", descAr: "أنجزت هدفك اليومي", emoji: "🎯", check: (s) => s.todayCount >= s.dailyGoal },
];

function readState(): GamiState {
  let achievements: string[] = [];
  try { achievements = JSON.parse(localStorage.getItem(K_ACHIEVEMENTS) || "[]"); } catch {}
  const today = isoDay();
  const todayDay = localStorage.getItem(K_TODAY_DAY);
  const todayCount = todayDay === today ? getNum(K_TODAY_COUNT) : 0;
  return {
    streak: getNum(K_STREAK),
    bestStreak: getNum(K_BEST_STREAK),
    todayCount,
    dailyGoal: getNum(K_GOAL, 10) || 10,
    totalVerses: getNum(K_TOTAL),
    practiceSessions: getNum(K_PRACTICE),
    achievements,
  };
}

function saveAchievements(ids: string[]) {
  try { localStorage.setItem(K_ACHIEVEMENTS, JSON.stringify(ids)); } catch {}
}

function checkUnlocks(state: GamiState): { state: GamiState; newly: Achievement[] } {
  const newly: Achievement[] = [];
  const set = new Set(state.achievements);
  for (const a of ACHIEVEMENTS) {
    if (!set.has(a.id) && a.check(state)) {
      set.add(a.id);
      newly.push(a);
    }
  }
  const nextState = { ...state, achievements: Array.from(set) };
  if (newly.length) saveAchievements(nextState.achievements);
  return { state: nextState, newly };
}

/** Call once per verse read/practiced. Handles streak + daily count + achievements. */
export function recordVerseActivity(kind: "read" | "practice" = "read") {
  const today = isoDay();
  const lastDay = localStorage.getItem(K_LAST_DAY);
  let streak = getNum(K_STREAK);
  if (lastDay !== today) {
    if (!lastDay) streak = 1;
    else {
      const gap = daysBetween(lastDay, today);
      streak = gap === 1 ? streak + 1 : 1;
    }
    setNum(K_STREAK, streak);
    localStorage.setItem(K_LAST_DAY, today);
    setNum(K_TODAY_COUNT, 0);
    localStorage.setItem(K_TODAY_DAY, today);
  }
  const best = Math.max(getNum(K_BEST_STREAK), streak);
  setNum(K_BEST_STREAK, best);

  // today count
  const todayDay = localStorage.getItem(K_TODAY_DAY);
  const prevTodayCount = todayDay === today ? getNum(K_TODAY_COUNT) : 0;
  const nextTodayCount = prevTodayCount + 1;
  setNum(K_TODAY_COUNT, nextTodayCount);
  localStorage.setItem(K_TODAY_DAY, today);

  // totals
  setNum(K_TOTAL, getNum(K_TOTAL) + 1);
  if (kind === "practice") setNum(K_PRACTICE, getNum(K_PRACTICE) + 1);

  const state = readState();
  const { newly } = checkUnlocks(state);
  newly.forEach((a) => {
    toast({ title: `${a.emoji} إنجاز جديد: ${a.labelAr}`, description: a.descAr });
  });
  window.dispatchEvent(new Event("quran-gami-updated"));
}

export function setDailyGoal(n: number) {
  setNum(K_GOAL, Math.max(1, Math.min(500, n)));
  window.dispatchEvent(new Event("quran-gami-updated"));
}

export function useGamification(): GamiState & { setDailyGoal: (n: number) => void } {
  const [s, setS] = useState<GamiState>(() => readState());
  useEffect(() => {
    const refresh = () => setS(readState());
    window.addEventListener("quran-gami-updated", refresh);
    window.addEventListener("storage", refresh);
    // midnight rollover: refresh today's count when day changes
    const timer = setInterval(() => setS(readState()), 60_000);
    return () => {
      window.removeEventListener("quran-gami-updated", refresh);
      window.removeEventListener("storage", refresh);
      clearInterval(timer);
    };
  }, []);
  return { ...s, setDailyGoal };
}
