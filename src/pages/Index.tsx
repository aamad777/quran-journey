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
import MushafPage from "@/components/MushafPage";
import DownloadsManager from "@/components/DownloadsManager";

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
  BookA,
  BookMarked,
  Download,
  ChevronLeft,
  ChevronRight
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

  // Parallax: subtle vertical translate based on scroll
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const parallaxOffset = scrollY * 0.25;

  // Crossfade between background images on change
  const [prevBgImage, setPrevBgImage] = useState<string | undefined>(bgPattern?.image);
  const [currentBgImage, setCurrentBgImage] = useState<string | undefined>(bgPattern?.image);
  const [bgTransitioning, setBgTransitioning] = useState(false);
  useEffect(() => {
    if (bgPattern?.image !== currentBgImage) {
      setPrevBgImage(currentBgImage);
      setCurrentBgImage(bgPattern?.image);
      setBgTransitioning(true);
      const t = setTimeout(() => setBgTransitioning(false), 900);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgPattern?.image]);

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
    "read" | "practice" | "draw" | "type" | "stats" | "search" | "alphabets" | "page" | "downloads"
  >(() => {
    try {
      return (
        (localStorage.getItem("quran_active_tab") as any) || "read"
      );
    } catch {
      return "read";
    }
  });

  const [railPinned, setRailPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem("quran_rail_pinned") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("quran_rail_pinned", railPinned ? "1" : "0");
    } catch {}
  }, [railPinned]);

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

  const SURAH_AYAH_COUNT = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  const TOTAL_VERSES = 6236;
  const versesRead = SURAH_AYAH_COUNT.slice(0, progress.surah_number - 1).reduce((a, b) => a + b, 0) + progress.ayah_number;
  const versesRemaining = TOTAL_VERSES - versesRead;
  const progressPercent = Math.min(100, Math.ceil((versesRead / TOTAL_VERSES) * 100));
  const isLoading = progressLoading || verseLoading;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {bgTransitioning && prevBgImage && (
        <div
          key={`prev-${prevBgImage}`}
          className="fixed inset-x-0 -top-24 -bottom-24 pointer-events-none will-change-transform animate-bg-fade-out"
          style={{
            backgroundImage: `url(${prevBgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `translate3d(0, ${parallaxOffset}px, 0) scale(1.05)`,
            opacity: bgOpacity,
          }}
        />
      )}
      {currentBgImage && (
        <div
          key={`cur-${currentBgImage}`}
          className={`fixed inset-x-0 -top-24 -bottom-24 pointer-events-none will-change-transform ${bgTransitioning ? 'animate-bg-fade-in' : ''}`}
          style={{
            backgroundImage: `url(${currentBgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `translate3d(0, ${parallaxOffset}px, 0)`,
            opacity: bgOpacity,
          }}
        />
      )}
      {overlayOpacity > 0 && (
        <div className="fixed inset-0 bg-background pointer-events-none transition-opacity duration-700 ease-in-out" style={{ opacity: overlayOpacity }} />
      )}
      <div className="relative z-[1]">

      {/* Compact Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl border-b" style={{ backgroundColor: `${bgTheme.cardBg}ee`, borderColor: `${bgTheme.mutedText}18` }}>
        <div className="container max-w-4xl mx-auto flex items-center justify-between h-14 px-3 sm:px-4 gap-2">
          <button onClick={() => { setActiveTab("read"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-1.5 sm:gap-2.5 hover:opacity-80 transition-opacity min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg gradient-gold flex items-center justify-center" style={{ boxShadow: `0 2px 8px ${bgTheme.btnBg}30` }}>
              <span className="text-sm font-arabic font-bold text-primary-foreground">قٌ</span>
            </div>
            <h1 className="font-arabic text-sm sm:text-base font-bold truncate" style={{ color: bgTheme.textColor }}>قارئ القرآن</h1>
            {/* Compact heart progress next to brand */}
            <div className="relative w-7 h-7 shrink-0" title={`${progressPercent}٪ مكتمل`}>
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" style={{ stroke: `${bgTheme.btnBg}20` }} />
                <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${progressPercent * 0.975} 100`} style={{ stroke: bgTheme.btnBg, transition: 'stroke-dasharray 0.7s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart
                  className="w-3 h-3 fill-current"
                  style={{
                    color: bgTheme.btnBg,
                    filter: `drop-shadow(0 0 ${2 + progressPercent * 0.05}px ${bgTheme.btnBg})`,
                    animation: `heartbeat ${Math.max(0.3, 1.5 - (progressPercent * 0.012))}s ease-in-out infinite`,
                  }}
                />
              </div>
            </div>
          </button>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <BackgroundSelector background={background} setBackground={setBackground} opacity={bgOpacity} setOpacity={setBgOpacity} />
            <ThemeSwitcher theme={theme} setTheme={setTheme} mode={mode} toggleMode={toggleMode} />
            <SurahList currentSurah={progress.surah_number} onSelect={goToSurah} />
            {user ? (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} style={{ color: bgTheme.mutedText }}>
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={() => navigate("/auth")} style={{ color: bgTheme.mutedText }} aria-label="دخول">
                  <LogIn className="w-4 h-4" />
                </Button>
                <Button size="icon" className="h-8 w-8 sm:hidden" onClick={() => navigate("/auth?tab=register")} style={{ backgroundColor: bgTheme.btnBg, color: bgTheme.btnText }} aria-label="تسجيل">
                  <UserPlus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 px-3 hidden sm:inline-flex" onClick={() => navigate("/auth")} style={{ color: bgTheme.mutedText }}>
                  <LogIn className="w-3.5 h-3.5" />
                  دخول
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1.5 px-3 hidden sm:inline-flex" onClick={() => navigate("/auth?tab=register")} style={{ backgroundColor: bgTheme.btnBg, color: bgTheme.btnText }}>
                  <UserPlus className="w-3.5 h-3.5" />
                  تسجيل
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Unified Info Strip: Prayer + Guest */}
      <div className="backdrop-blur-sm border-b" style={{ backgroundColor: `${bgTheme.cardBg}cc`, borderColor: `${bgTheme.mutedText}12` }}>
        <div className="container max-w-4xl mx-auto px-4">
          <PrayerBanner textColor={bgTheme.textColor} mutedText={bgTheme.mutedText} accentColor={bgTheme.btnBg} cardBg={bgTheme.cardBg} />
          {!user && (
            <div className="py-1.5 text-center border-t" style={{ borderColor: `${bgTheme.mutedText}10` }}>
              <p className="text-[11px]" style={{ color: bgTheme.mutedText }}>
                تقرأ كضيف. <button onClick={() => navigate("/auth")} className="font-semibold hover:underline" style={{ color: bgTheme.btnBg }}>سجّل دخولك</button> لحفظ تقدمك عبر الأجهزة.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Permission Prompt */}
      <div className="container max-w-4xl mx-auto px-4 pt-3">
        <PermissionPrompt />
      </div>

      {/* Floating Right-Side Tab Rail — toggle button + manual expand (desktop only) */}
      <div
        className={`fixed top-1/2 right-0 -translate-y-1/2 z-30 hidden md:block ${railPinned ? 'is-pinned' : ''}`}
        dir="ltr"
      >
        {/* Toggle button — always visible on the edge */}
        <button
          onClick={() => setRailPinned(p => !p)}
          aria-label={railPinned ? "إغلاق شريط التبويبات" : "فتح شريط التبويبات"}
          className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-12 flex items-center justify-center rounded-l-xl backdrop-blur-md border border-r-0 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            backgroundColor: `${bgTheme.cardBg}f0`,
            borderColor: `${bgTheme.mutedText}25`,
            color: bgTheme.btnBg,
          }}
        >
          {railPinned ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {/* Thin edge indicator visible when collapsed */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 right-0 w-1 h-24 rounded-l-full transition-opacity duration-300 ${railPinned ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundColor: `${bgTheme.btnBg}60` }}
        />
        <div
          className={`flex flex-col gap-1.5 p-2 rounded-l-2xl backdrop-blur-xl border border-r-0 shadow-2xl transition-all duration-300 ease-out ${railPinned ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}
          style={{
            backgroundColor: `${bgTheme.cardBg}f5`,
            borderColor: `${bgTheme.mutedText}25`,
            boxShadow: `0 8px 32px ${bgTheme.btnBg}25`,
          }}
        >
          {/* Reading progress summary */}
          <div dir="rtl" className="px-2 pt-1 pb-2 border-b" style={{ borderColor: `${bgTheme.mutedText}20` }}>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-arabic font-semibold" style={{ color: bgTheme.textColor }}>
                  {versesRead.toLocaleString("ar-EG")} مقروءة
                </span>
                <span className="text-[10px]" style={{ color: bgTheme.mutedText }}>{progressPercent}٪</span>
              </div>
              <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: `${bgTheme.btnBg}15` }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${bgTheme.btnBg}, ${bgTheme.activeWordColor})` }} />
              </div>
              <span className="text-[10px] font-arabic" style={{ color: bgTheme.mutedText }}>
                {versesRemaining.toLocaleString("ar-EG")} آية متبقية
              </span>
            </div>
          </div>

          {([
            { key: "read" as const, icon: <BookOpen className="w-4 h-4" />, label: "قراءة" },
            { key: "practice" as const, icon: <Mic className="w-4 h-4" />, label: "صوت" },
            { key: "draw" as const, icon: <PenTool className="w-4 h-4" />, label: "رسم" },
            { key: "type" as const, icon: <Keyboard className="w-4 h-4" />, label: "كتابة" },
            { key: "stats" as const, icon: <BarChart3 className="w-4 h-4" />, label: "إحصائيات" },
            { key: "page" as const, icon: <BookMarked className="w-4 h-4" />, label: "صفحة" },
            { key: "search" as const, icon: <Search className="w-4 h-4" />, label: "بحث" },
            { key: "alphabets" as const, icon: <BookA className="w-4 h-4" />, label: "حروف" },
            { key: "downloads" as const, icon: <Download className="w-4 h-4" />, label: "تحميلات" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              dir="rtl"
              className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold font-arabic rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab !== tab.key ? 'hover:scale-[1.03] hover:brightness-110 active:scale-95' : ''}`}
              style={
                activeTab === tab.key
                  ? { backgroundColor: bgTheme.btnBg, color: bgTheme.btnText, boxShadow: `0 2px 8px ${bgTheme.btnBg}40` }
                  : { backgroundColor: `${bgTheme.mutedText}15`, color: bgTheme.mutedText }
              }
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden backdrop-blur-xl border-t" style={{ backgroundColor: `${bgTheme.cardBg}f0`, borderColor: `${bgTheme.mutedText}20` }}>
        <div className="flex items-center justify-around h-14 px-1">
          {([
            { key: "read" as const, icon: <BookOpen className="w-5 h-5" />, label: "قراءة" },
            { key: "search" as const, icon: <Search className="w-5 h-5" />, label: "بحث" },
            { key: "page" as const, icon: <BookMarked className="w-5 h-5" />, label: "صفحة" },
            { key: "practice" as const, icon: <Mic className="w-5 h-5" />, label: "صوت" },
            { key: "more" as const, icon: <Layers className="w-5 h-5" />, label: "المزيد" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => tab.key === "more" ? setRailPinned(true) : setActiveTab(tab.key as any)}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-xl transition-all duration-200 active:scale-95"
              style={
                (tab.key !== "more" && activeTab === tab.key)
                  ? { color: bgTheme.btnBg }
                  : { color: bgTheme.mutedText }
              }
            >
              {tab.icon}
              <span className="text-[10px] font-arabic font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-6 md:py-10">
        {activeTab === "stats" ? (
          <QuranStats
            surahNumber={progress.surah_number}
            ayahNumber={progress.ayah_number}
            versesRead={versesRead}
            versesRemaining={versesRemaining}
            progressPercent={progressPercent}
            voiceCorrect={voiceCorrect}
            drawCorrect={drawCorrect}
          />
        ) : activeTab === "search" ? (
          <VerseSearch
            onSelectVerse={(surah, ayah) => { goToVerse(surah, ayah); setActiveTab("read"); }}
            themeTextColor={bgTheme.textColor}
            themeMutedText={bgTheme.mutedText}
            themeCardBg={bgTheme.cardBg}
            themeAccentColor={bgTheme.btnBg}
          />
        ) : activeTab === "page" ? (
          <MushafPage
            themeTextColor={bgTheme.textColor}
            themeMutedText={bgTheme.mutedText}
            themeCardBg={bgTheme.cardBg}
            themeAccentColor={bgTheme.btnBg}
          />
        ) : activeTab === "alphabets" ? (
          <AlphabetTajweed
            themeTextColor={bgTheme.textColor}
            themeMutedText={bgTheme.mutedText}
            themeCardBg={bgTheme.cardBg}
            themeAccentColor={bgTheme.btnBg}
          />
        ) : activeTab === "downloads" ? (
          <DownloadsManager
            themeTextColor={bgTheme.textColor}
            themeMutedText={bgTheme.mutedText}
            themeCardBg={bgTheme.cardBg}
            themeAccentColor={bgTheme.btnBg}
          />
        ) : isLoading || verses.length === 0 ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <Skeleton className="h-10 w-48 mx-auto rounded-full" />
              <Skeleton className="h-4 w-32 mx-auto mt-2" />
            </div>
            <div className="bg-card rounded-2xl border border-border p-12">
              <Skeleton className="h-16 w-full mb-8" />
              <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>
          </div>
        ) : activeTab === "read" ? (
          <VerseCard
            verses={verses}
            audioUrl={audioUrl}
            audioUrls={audioUrls}
            reciters={reciters}
            selectedReciter={selectedReciter}
            onReciterChange={setSelectedReciter}
            onNext={() => goToNext(verseCount)}
            onPrev={() => goToPrev(verseCount)}
            verseCount={verseCount}
            onVerseCountChange={setVerseCount}
            activeWordColor={bgTheme.activeWordColor}
            activeWordGlow={bgTheme.activeWordGlow}
            themeTextColor={bgTheme.textColor}
            themeMutedText={bgTheme.mutedText}
            themeCardBg={bgTheme.cardBg}
            themeAccentColor={bgTheme.btnBg}
            isSurahLevel={isSurahLevel}
          />
        ) : activeTab === "practice" ? (
          <PracticeMode
            verses={verses}
            onNext={() => goToNext(verseCount)}
            onPrev={() => goToPrev(verseCount)}
            onCorrectWord={onVoiceCorrect}
          />
        ) : activeTab === "type" ? (
          <TypePracticeMode
            verses={verses}
            onNext={() => goToNext(verseCount)}
            onPrev={() => goToPrev(verseCount)}
          />
        ) : (
          <DrawPracticeMode
            verses={verses}
            onNext={() => goToNext(verseCount)}
            onPrev={() => goToPrev(verseCount)}
            onCorrectWord={onDrawCorrect}
          />
        )}
      </main>
      </div>
    </div>
  );
};

export default Index;