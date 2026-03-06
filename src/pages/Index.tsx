import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuranProgress } from "@/hooks/useQuranProgress";
import { useQuranVerse } from "@/hooks/useQuranVerse";
import { useNavigate } from "react-router-dom";
import VerseCard from "@/components/VerseCard";
import SurahList from "@/components/SurahList";
import { BookOpen, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { progress, loading: progressLoading, goToNext, goToPrev, goToSurah } = useQuranProgress(user);
  const [verseCount, setVerseCount] = useState(() => {
    try { return parseInt(localStorage.getItem("quran_verse_count") || "1"); } catch { return 1; }
  });

  useEffect(() => {
    localStorage.setItem("quran_verse_count", String(verseCount));
  }, [verseCount]);

  const { verses, audioUrl, loading: verseLoading, selectedReciter, setSelectedReciter, reciters } =
    useQuranVerse(progress.surah_number, progress.ayah_number, verseCount);
  const navigate = useNavigate();

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

  const isLoading = progressLoading || verseLoading;

  return (
    <div className="min-h-screen bg-background islamic-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-islamic flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gold" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">قارئ القرآن</h1>
          </div>
          <div className="flex items-center gap-2">
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

      {/* Guest Banner */}
      {!user && (
        <div className="bg-accent/20 border-b border-border">
          <div className="container max-w-4xl mx-auto px-4 py-2 text-center">
            <p className="text-sm text-muted-foreground">
              Reading as guest. <button onClick={() => navigate("/auth")} className="text-gold font-semibold hover:underline">Sign in</button> to save your progress across devices.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8 md:py-16">
        {isLoading || verses.length === 0 ? (
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
        ) : (
          <VerseCard
            verses={verses}
            audioUrl={audioUrl}
            reciters={reciters}
            selectedReciter={selectedReciter}
            onReciterChange={setSelectedReciter}
            onNext={goToNext}
            onPrev={goToPrev}
            verseCount={verseCount}
            onVerseCountChange={setVerseCount}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
