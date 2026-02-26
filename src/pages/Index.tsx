import { useAuth } from "@/hooks/useAuth";
import { useQuranProgress } from "@/hooks/useQuranProgress";
import { useQuranVerse } from "@/hooks/useQuranVerse";
import { Navigate } from "react-router-dom";
import VerseCard from "@/components/VerseCard";
import { BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { progress, loading: progressLoading, goToNext, goToPrev } = useQuranProgress(user);
  const { verse, audioUrl, loading: verseLoading, selectedReciter, setSelectedReciter, reciters } =
    useQuranVerse(progress.surah_number, progress.ayah_number);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background islamic-pattern">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-islamic mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-gold" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
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
            <h1 className="font-display text-xl font-bold text-foreground">Quran Reader</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8 md:py-16">
        {isLoading || !verse ? (
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
            arabic={verse.arabic}
            translation={verse.translation}
            surahName={verse.surahName}
            surahNameArabic={verse.surahNameArabic}
            surahNumber={progress.surah_number}
            ayahNumber={progress.ayah_number}
            audioUrl={audioUrl}
            reciters={reciters}
            selectedReciter={selectedReciter}
            onReciterChange={setSelectedReciter}
            onNext={goToNext}
            onPrev={goToPrev}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
