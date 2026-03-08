import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuranProgress } from "@/hooks/useQuranProgress";
import { useQuranVerse } from "@/hooks/useQuranVerse";
import { useNavigate } from "react-router-dom";
import VerseCard from "@/components/VerseCard";
import PracticeMode from "@/components/PracticeMode";
import DrawPracticeMode from "@/components/DrawPracticeMode";
import QuranStats from "@/components/QuranStats";
import SurahList from "@/components/SurahList";
import { BookOpen, LogOut, LogIn, Mic, PenTool, BarChart3 } from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import PrayerBanner from "@/components/PrayerBanner";
import PermissionPrompt from "@/components/PermissionPrompt";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { theme, setTheme, mode, toggleMode } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const { progress, loading: progressLoading, goToNext, goToPrev, goToSurah } = useQuranProgress(user);
  const [activeTab, setActiveTab] = useState<"read" | "practice" | "draw" | "stats">(() => {
    try { return (localStorage.getItem("quran_active_tab") as "read" | "practice" | "draw" | "stats") || "read"; } catch { return "read"; }
  });
  const [verseCount, setVerseCount] = useState(() => {
    try { return parseInt(localStorage.getItem("quran_verse_count") || "1"); } catch { return 1; }
  });
  const [voiceCorrect, setVoiceCorrect] = useState(() => {
    try { return parseInt(localStorage.getItem("quran_voice_correct") || "0"); } catch { return 0; }
  });
  const [drawCorrect, setDrawCorrect] = useState(() => {
    try { return parseInt(localStorage.getItem("quran_draw_correct") || "0"); } catch { return 0; }
  });

  useEffect(() => {
    localStorage.setItem("quran_verse_count", String(verseCount));
  }, [verseCount]);

  useEffect(() => {
    localStorage.setItem("quran_active_tab", activeTab);
  }, [activeTab]);

  const { verses, audioUrl, audioUrls, loading: verseLoading, selectedReciter, setSelectedReciter, reciters } =
    useQuranVerse(progress.surah_number, progress.ayah_number, verseCount);
  const navigate = useNavigate();

  const onVoiceCorrect = () => setVoiceCorrect(prev => {
    const n = prev + 1;
    localStorage.setItem("quran_voice_correct", String(n));
    return n;
  });
  const onDrawCorrect = () => setDrawCorrect(prev => {
    const n = prev + 1;
    localStorage.setItem("quran_draw_correct", String(n));
    return n;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern">
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
    <div className="min-h-screen bg-background islamic-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto flex items-center justify-between py-4 px-4">
          <button onClick={() => { setActiveTab("read"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center shadow-gold">
              <span className="text-xl font-arabic font-bold text-primary-foreground">قـ</span>
            </div>
            <h1 className="font-arabic text-xl font-bold text-foreground tracking-wide">قارئ القرآن</h1>
          </button>
          <div className="flex items-center gap-2">
            <ThemeSwitcher theme={theme} setTheme={setTheme} mode={mode} toggleMode={toggleMode} />
            <SurahList currentSurah={progress.surah_number} onSelect={goToSurah} />
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-2" />
                خروج
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
                <LogIn className="w-4 h-4 mr-2" />
                دخول
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Prayer Times Banner */}
      <PrayerBanner />

      {/* Guest Banner */}
      {!user && (
        <div className="bg-accent/20 border-b border-border">
          <div className="container max-w-4xl mx-auto px-4 py-2 text-center">
            <p className="text-sm text-muted-foreground">
              تقرأ كضيف. <button onClick={() => navigate("/auth")} className="text-gold font-semibold hover:underline">سجّل دخولك</button> لحفظ تقدمك عبر الأجهزة.
            </p>
          </div>
        </div>
      )}

      {/* Permission Prompt */}
      <div className="container max-w-4xl mx-auto px-4 pt-4">
        <PermissionPrompt />
      </div>

      {/* Progress counter only */}
      <div className="container max-w-4xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 bg-card/60 backdrop-blur-sm rounded-full border border-border px-4 py-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all duration-700" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {versesRemaining.toLocaleString("ar-EG")} آية متبقية ({progressPercent}٪)
          </span>
        </div>
      </div>


      <div className="container max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={activeTab === "read" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("read")}
            className="rounded-full gap-2"
          >
            <BookOpen className="w-4 h-4" />
            قراءة
          </Button>
          <Button
            variant={activeTab === "practice" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("practice")}
            className="rounded-full gap-2"
          >
            <Mic className="w-4 h-4" />
            صوت
          </Button>
          <Button
            variant={activeTab === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("draw")}
            className="rounded-full gap-2"
          >
            <PenTool className="w-4 h-4" />
            رسم
          </Button>
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("stats")}
            className="rounded-full gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            إحصائيات
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
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
          />
        ) : activeTab === "practice" ? (
          <PracticeMode
            verses={verses}
            onNext={() => goToNext(verseCount)}
            onPrev={() => goToPrev(verseCount)}
            onCorrectWord={onVoiceCorrect}
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
  );
};

export default Index;
