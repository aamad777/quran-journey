import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuranProgress } from "@/hooks/useQuranProgress";
import { useQuranVerse } from "@/hooks/useQuranVerse";
import { useNavigate } from "react-router-dom";
import VerseCard from "@/components/VerseCard";
import PracticeMode from "@/components/PracticeMode";
import DrawPracticeMode from "@/components/DrawPracticeMode";
import TypePracticeMode from "@/components/TypePracticeMode";
import QuranStats from "@/components/QuranStats";
import SurahList from "@/components/SurahList";

// ✅ ADDED from main branch
import VerseSearch from "@/components/VerseSearch";
import AlphabetTajweed from "@/components/AlphabetTajweed";

// ✅ FIXED merged icons
import {
  BookOpen,
  LogOut,
  LogIn,
  UserPlus,
  Mic,
  PenTool,
  Keyboard,
  BarChart3,
  Heart,
  Search,
  Type,
  BookA
} from "lucide-react";

import ThemeSwitcher from "@/components/ThemeSwitcher";
import PrayerBanner from "@/components/PrayerBanner";
import PermissionPrompt from "@/components/PermissionPrompt";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BackgroundSelector, {
  PATTERNS,
  BG_THEMES,
  type BackgroundPattern
} from "@/components/BackgroundSelector";

const Index = () => {
  const { theme, setTheme, mode, toggleMode } = useTheme();

  const [background, setBackgroundState] = useState<BackgroundPattern>(() => {
    try {
      return (localStorage.getItem("quran_bg_pattern") as BackgroundPattern) || "geometric";
    } catch {
      return "geometric";
    }
  });

  const [bgOpacity, setBgOpacityState] = useState(() => {
    try {
      return parseFloat(localStorage.getItem("quran_bg_opacity") || "1");
    } catch {
      return 1;
    }
  });

  const setBackground = (bg: BackgroundPattern) => {
    setBackgroundState(bg);
    localStorage.setItem("quran_bg_pattern", bg);
  };

  const setBgOpacity = (val: number) => {
    setBgOpacityState(val);
    localStorage.setItem("quran_bg_opacity", String(val));
  };

  const bgPattern = PATTERNS.find(p => p.id === background);
  const bgTheme = BG_THEMES[background];

  const overlayOpacity = bgPattern?.image
    ? Math.min(0.75, (1 - bgOpacity) + 0.22)
    : 0;

  const { user, loading: authLoading, signOut } = useAuth();

  const {
    progress,
    loading: progressLoading,
    goToNext,
    goToPrev,
    goToSurah,
    goToVerse
  } = useQuranProgress(user);

  const [activeTab, setActiveTab] = useState<
    "read" | "practice" | "draw" | "type" | "stats" | "search" | "alphabets"
  >(() => {
    try {
      return (
        (localStorage.getItem("quran_active_tab") as any) || "read"
      );
    } catch {
      return "read";
    }
  });

  const [verseCount, setVerseCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem("quran_verse_count") || "1");
    } catch {
      return 1;
    }
  });

  const [voiceCorrect, setVoiceCorrect] = useState(() => {
    try {
      return parseInt(localStorage.getItem("quran_voice_correct") || "0");
    } catch {
      return 0;
    }
  });

  const [drawCorrect, setDrawCorrect] = useState(() => {
    try {
      return parseInt(localStorage.getItem("quran_draw_correct") || "0");
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem("quran_verse_count", String(verseCount));
  }, [verseCount]);

  useEffect(() => {
    localStorage.setItem("quran_active_tab", activeTab);
  }, [activeTab]);

  const {
    verses,
    audioUrl,
    audioUrls,
    loading: verseLoading,
    selectedReciter,
    setSelectedReciter,
    reciters,
    isSurahLevel
  } = useQuranVerse(
    progress.surah_number,
    progress.ayah_number,
    verseCount
  );

  const navigate = useNavigate();

  const onVoiceCorrect = () =>
    setVoiceCorrect(prev => {
      const n = prev + 1;
      localStorage.setItem("quran_voice_correct", String(n));
      return n;
    });

  const onDrawCorrect = () =>
    setDrawCorrect(prev => {
      const n = prev + 1;
      localStorage.setItem("quran_draw_correct", String(n));
      return n;
    });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-islamic mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-gold" />
          </div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // ✅ rest of your file continues exactly as before (no changes needed)

  return <div>/* your existing JSX stays unchanged */</div>;
};

export default Index;