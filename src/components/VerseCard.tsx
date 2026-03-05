import { useRef, useState, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, RotateCw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Reciter {
  id: string;
  name: string;
}

const DELAY_OPTIONS = [
  { value: "0", label: "Instant" },
  { value: "1", label: "1 second" },
  { value: "2", label: "2 seconds" },
  { value: "3", label: "3 seconds" },
  { value: "5", label: "5 seconds" },
];

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
  const [autoPlay, setAutoPlay] = useState(() => {
    try { return localStorage.getItem("quran_autoplay") === "true"; } catch { return false; }
  });
  const [advanceDelay, setAdvanceDelay] = useState(() => {
    try { return localStorage.getItem("quran_advance_delay") || "0"; } catch { return "0"; }
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("quran_autoplay", String(autoPlay));
  }, [autoPlay]);

  useEffect(() => {
    localStorage.setItem("quran_advance_delay", advanceDelay);
  }, [advanceDelay]);

  // Auto-play audio when verse changes if autoPlay is on
  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrl) {
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrl, autoPlay]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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
    if (autoPlay) {
      const delay = parseInt(advanceDelay) * 1000;
      if (delay === 0) {
        onNext();
      } else {
        // Start countdown
        setCountdown(parseInt(advanceDelay));
        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.ceil((delay - elapsed) / 1000);
          if (remaining <= 0) {
            clearInterval(interval);
            setCountdown(null);
            onNext();
          } else {
            setCountdown(remaining);
          }
        }, 200);
        timerRef.current = interval as unknown as NodeJS.Timeout;
      }
    }
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
          {/* Auto-play toggle + delay */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="autoplay" className="text-xs text-muted-foreground cursor-pointer">Auto-advance</Label>
              <Switch id="autoplay" checked={autoPlay} onCheckedChange={setAutoPlay} className="scale-75" />
            </div>
            {autoPlay && (
              <div className="flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                <Select value={advanceDelay} onValueChange={setAdvanceDelay}>
                  <SelectTrigger className="w-32 h-8 bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELAY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Countdown indicator */}
          {countdown !== null && (
            <div className="text-center">
              <span className="text-xs text-muted-foreground animate-pulse">
                Next verse in {countdown}s...
              </span>
            </div>
          )}

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
