import { useRef, useState, useEffect, useMemo } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, RotateCw, Timer, Type, Layers, Palette, BookOpen } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { parseTajweed, TAJWEED_RULES } from "@/lib/tajweedParser";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Reciter {
  id: string;
  name: string;
}

interface VerseData {
  arabic: string;
  tajweedText: string;
  translation: string;
  surahName: string;
  surahNameArabic: string;
  surahNumber: number;
  ayahNumber: number;
}

const DELAY_OPTIONS = [
  { value: "0", label: "Instant" },
  { value: "1", label: "1 second" },
  { value: "2", label: "2 seconds" },
  { value: "3", label: "3 seconds" },
  { value: "5", label: "5 seconds" },
];

interface VerseCardProps {
  verses: VerseData[];
  audioUrl: string;
  reciters: Reciter[];
  selectedReciter: string;
  onReciterChange: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
  verseCount: number;
  onVerseCountChange: (count: number) => void;
}

const VerseCard = ({
  verses,
  audioUrl,
  reciters,
  selectedReciter,
  onReciterChange,
  onNext,
  onPrev,
  verseCount,
  onVerseCountChange,
}: VerseCardProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(() => {
    try { return localStorage.getItem("quran_autoplay") === "true"; } catch { return false; }
  });
  const [advanceDelay, setAdvanceDelay] = useState(() => {
    try { return localStorage.getItem("quran_advance_delay") || "0"; } catch { return "0"; }
  });
  const [fontSize, setFontSize] = useState(() => {
    try { return parseInt(localStorage.getItem("quran_font_size") || "36"); } catch { return 36; }
  });
  const [wordColor, setWordColor] = useState(() => {
    try { return localStorage.getItem("quran_word_color") === "true"; } catch { return false; }
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const WORD_COLORS = [
    "hsl(var(--word-color-1))",
    "hsl(var(--word-color-2))",
    "hsl(var(--word-color-3))",
    "hsl(var(--word-color-4))",
  ];

  useEffect(() => { localStorage.setItem("quran_autoplay", String(autoPlay)); }, [autoPlay]);
  useEffect(() => { localStorage.setItem("quran_advance_delay", advanceDelay); }, [advanceDelay]);
  useEffect(() => { localStorage.setItem("quran_font_size", String(fontSize)); }, [fontSize]);
  useEffect(() => { localStorage.setItem("quran_word_color", String(wordColor)); }, [wordColor]);

  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrl) {
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrl, autoPlay]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (autoPlay) {
      const delay = parseInt(advanceDelay) * 1000;
      if (delay === 0) {
        onNext();
      } else {
        setCountdown(parseInt(advanceDelay));
        const startTime = Date.now();
        const interval = setInterval(() => {
          const remaining = Math.ceil((delay - (Date.now() - startTime)) / 1000);
          if (remaining <= 0) {
            clearInterval(interval);
            setCountdown(null);
            onNext();
          } else {
            setCountdown(remaining);
          }
        }, 200);
        timerRef.current = interval;
      }
    }
  };

  const primaryVerse = verses[0];
  if (!primaryVerse) return null;

  return (
    <div className="animate-verse-enter w-full max-w-2xl mx-auto">
      {/* Surah Header */}
      <div className="text-center mb-6">
        <div className="inline-block px-6 py-2 rounded-full bg-primary/10 border border-primary/20">
          <span className="font-arabic text-lg text-gold">{primaryVerse.surahNameArabic}</span>
          <span className="mx-3 text-border">|</span>
          <span className="font-display text-sm text-foreground">{primaryVerse.surahName}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Surah {primaryVerse.surahNumber} • Ayah {primaryVerse.ayahNumber}
          {verses.length > 1 && `–${verses[verses.length - 1].ayahNumber}`}
        </p>
      </div>

      {/* Verse Card */}
      <div className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-gold">
        {/* Verses */}
        {verses.map((v, i) => (
          <div key={`${v.surahNumber}:${v.ayahNumber}`}>
            {i > 0 && (
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{v.ayahNumber}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {/* Arabic Text */}
            <div className="text-center mb-4" dir="rtl">
              <p
                className="font-arabic leading-[2.2]"
                style={{ fontSize: `${fontSize}px` }}
              >
                {wordColor ? (
                  v.arabic.split(/\s+/).map((word, wi) => (
                    <span
                      key={wi}
                      style={{ color: WORD_COLORS[wi % WORD_COLORS.length] }}
                    >
                      {word}{" "}
                    </span>
                  ))
                ) : (
                  <span className="text-foreground">{v.arabic}</span>
                )}
              </p>
            </div>
            {/* Translation */}
            <div className="text-center mb-4">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-sans italic">
                "{v.translation}"
              </p>
            </div>
          </div>
        ))}

        {/* Divider before controls */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 rounded-full bg-gold" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Settings Row */}
        <div className="space-y-4">
          {/* Font size + verse count */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Font size */}
            <div className="flex items-center gap-2 min-w-[180px]">
              <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">Size</span>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => setFontSize(v[0])}
                min={20}
                max={56}
                step={2}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
            </div>

            {/* Word color */}
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="wordcolor" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">Word colors</Label>
              <Switch id="wordcolor" checked={wordColor} onCheckedChange={setWordColor} className="scale-75" />
            </div>

            {/* Verse count */}
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Verses</span>
              <Select value={String(verseCount)} onValueChange={(v) => onVerseCountChange(parseInt(v))}>
                <SelectTrigger className="w-16 h-8 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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

          {/* Countdown */}
          {countdown !== null && (
            <div className="text-center">
              <span className="text-xs text-muted-foreground animate-pulse">
                Next verse in {countdown}s...
              </span>
            </div>
          )}

          {/* Reciter */}
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
            <Button variant="outline" size="icon" onClick={onPrev} className="rounded-full border-border hover:bg-primary/10">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button onClick={togglePlay} size="icon" className="w-14 h-14 rounded-full gradient-islamic text-gold hover:opacity-90 transition-opacity">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </Button>
            <Button variant="outline" size="icon" onClick={onNext} className="rounded-full border-border hover:bg-primary/10">
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
