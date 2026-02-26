import { useRef, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Reciter {
  id: string;
  name: string;
}

interface VerseCardProps {
  arabic: string;
  translation: string;
  surahName: string;
  surahNameArabic: string;
  surahNumber: number;
  ayahNumber: number;
  audioUrl: string;
  reciters: Reciter[];
  selectedReciter: string;
  onReciterChange: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

const VerseCard = ({
  arabic,
  translation,
  surahName,
  surahNameArabic,
  surahNumber,
  ayahNumber,
  audioUrl,
  reciters,
  selectedReciter,
  onReciterChange,
  onNext,
  onPrev,
}: VerseCardProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="animate-verse-enter w-full max-w-2xl mx-auto">
      {/* Surah Header */}
      <div className="text-center mb-6">
        <div className="inline-block px-6 py-2 rounded-full bg-primary/10 border border-primary/20">
          <span className="font-arabic text-lg text-gold">{surahNameArabic}</span>
          <span className="mx-3 text-border">|</span>
          <span className="font-display text-sm text-foreground">{surahName}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Surah {surahNumber} • Ayah {ayahNumber}
        </p>
      </div>

      {/* Verse Card */}
      <div className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-gold">
        {/* Arabic Text */}
        <div className="text-center mb-8">
          <p className="font-arabic text-3xl md:text-4xl leading-[2.2] text-foreground" dir="rtl">
            {arabic}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 rounded-full bg-gold" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Translation */}
        <div className="text-center mb-8">
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-sans italic">
            "{translation}"
          </p>
        </div>

        {/* Audio Player */}
        <div className="space-y-4">
          {/* Reciter Selector */}
          <div className="flex items-center justify-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedReciter} onValueChange={onReciterChange}>
              <SelectTrigger className="w-64 bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reciters.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onPrev}
              className="rounded-full border-border hover:bg-primary/10"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              className="w-14 h-14 rounded-full gradient-islamic text-gold hover:opacity-90 transition-opacity"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={onNext}
              className="rounded-full border-border hover:bg-primary/10"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleEnded}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      </div>
    </div>
  );
};

export default VerseCard;
