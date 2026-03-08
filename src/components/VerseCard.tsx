import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, RotateCw, Timer, Type, Layers, BookOpen, X, Repeat, Download } from "lucide-react";
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
import { parseTajweed, TAJWEED_RULES, type TajweedRuleInfo } from "@/lib/tajweedParser";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Reciter {
  id: string;
  name: string;
}

interface VerseData {
  arabic: string;
  tajweedText: string;
  surahName: string;
  surahNameArabic: string;
  surahNumber: number;
  ayahNumber: number;
}

const DELAY_OPTIONS = [
  { value: "0", label: "فوري" },
  { value: "1", label: "١ ثانية" },
  { value: "2", label: "٢ ثواني" },
  { value: "3", label: "٣ ثواني" },
  { value: "5", label: "٥ ثواني" },
];

interface VerseCardProps {
  verses: VerseData[];
  audioUrl: string;
  audioUrls: string[];
  reciters: Reciter[];
  selectedReciter: string;
  onReciterChange: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
  verseCount: number;
  onVerseCountChange: (count: number) => void;
  activeWordColor?: string;
  activeWordGlow?: string;
  themeTextColor?: string;
  themeMutedText?: string;
  themeCardBg?: string;
  themeAccentColor?: string;
}

const VerseCard = ({
  verses,
  audioUrl,
  audioUrls,
  reciters,
  selectedReciter,
  onReciterChange,
  onNext,
  onPrev,
  verseCount,
  onVerseCountChange,
  activeWordColor = "hsl(38 65% 50%)",
  activeWordGlow = "0 0 12px hsl(38 65% 50% / 0.4)",
  themeTextColor,
  themeMutedText,
  themeCardBg,
  themeAccentColor,
}: VerseCardProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(() => {
    try { return localStorage.getItem("quran_autoplay") === "true"; } catch { return false; }
  });
  const [advanceDelay, setAdvanceDelay] = useState(() => {
    try { return localStorage.getItem("quran_advance_delay") || "0"; } catch { return "0"; }
  });
  const [fontSize, setFontSize] = useState(() => {
    try { return parseInt(localStorage.getItem("quran_font_size") || "36"); } catch { return 36; }
  });
  const [tajweedMode, setTajweedMode] = useState(() => {
    try { const v = localStorage.getItem("quran_tajweed"); return v === null ? true : v === "true"; } catch { return true; }
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [repeatCount, setRepeatCount] = useState(() => {
    try { return parseInt(localStorage.getItem("quran_repeat_count") || "1"); } catch { return 1; }
  });
  const currentRepeatRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tafseerOpen, setTafseerOpen] = useState(false);
  const [tafseerText, setTafseerText] = useState("");
  const [tafseerLoading, setTafseerLoading] = useState(false);
  const [tafseerVerse, setTafseerVerse] = useState("");
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tajweedPopupOpen, setTajweedPopupOpen] = useState(false);
  const [selectedTajweedRule, setSelectedTajweedRule] = useState<TajweedRuleInfo | null>(null);
  const tajweedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [tajweedAudioLoading, setTajweedAudioLoading] = useState(false);
  const [tajweedAudioPlaying, setTajweedAudioPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [pulseDuration, setPulseDuration] = useState(1.5);

  // Vivid gradient colors for active word during recitation
  const RECITE_GRADIENTS = [
    'linear-gradient(135deg, #FF6B35, #E91E63)',
    'linear-gradient(135deg, #E91E63, #9C27B0)',
    'linear-gradient(135deg, #9C27B0, #2196F3)',
    'linear-gradient(135deg, #2196F3, #00BCD4)',
    'linear-gradient(135deg, #00BCD4, #4CAF50)',
    'linear-gradient(135deg, #4CAF50, #FF9800)',
    'linear-gradient(135deg, #FF9800, #F44336)',
    'linear-gradient(135deg, #F44336, #3F51B5)',
    'linear-gradient(135deg, #3F51B5, #009688)',
    'linear-gradient(135deg, #009688, #FF6B35)',
  ];
  const getReciteGradient = (wi: number) => RECITE_GRADIENTS[wi % RECITE_GRADIENTS.length];
  const getReciteColor = (wi: number) => ['#FF6B35', '#E91E63', '#9C27B0', '#2196F3', '#00BCD4', '#4CAF50', '#FF9800', '#F44336', '#3F51B5', '#009688'][wi % 10];

  const playTajweedExample = useCallback(async (exampleRef: string) => {
    if (tajweedAudioRef.current) {
      tajweedAudioRef.current.pause();
      tajweedAudioRef.current = null;
    }
    setTajweedAudioLoading(true);
    setTajweedAudioPlaying(false);
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${exampleRef}/ar.alafasy`);
      const data = await res.json();
      if (data.code === 200 && data.data?.audio) {
        const audio = new Audio(data.data.audio);
        tajweedAudioRef.current = audio;
        audio.onended = () => setTajweedAudioPlaying(false);
        await audio.play();
        setTajweedAudioPlaying(true);
      }
    } catch (e) {
      console.error("Failed to play tajweed example:", e);
    }
    setTajweedAudioLoading(false);
  }, []);

  const stopTajweedExample = useCallback(() => {
    if (tajweedAudioRef.current) {
      tajweedAudioRef.current.pause();
      tajweedAudioRef.current = null;
      setTajweedAudioPlaying(false);
    }
  }, []);

  useEffect(() => { localStorage.setItem("quran_autoplay", String(autoPlay)); }, [autoPlay]);
  useEffect(() => { localStorage.setItem("quran_advance_delay", advanceDelay); }, [advanceDelay]);
  useEffect(() => { localStorage.setItem("quran_font_size", String(fontSize)); }, [fontSize]);
  useEffect(() => { localStorage.setItem("quran_tajweed", String(tajweedMode)); }, [tajweedMode]);
  useEffect(() => { localStorage.setItem("quran_repeat_count", String(repeatCount)); }, [repeatCount]);

  // Reset when verses change
  useEffect(() => {
    currentRepeatRef.current = 0;
    setCurrentAudioIndex(0);
  }, [audioUrl]);

  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrls.length > 0) {
      setCurrentAudioIndex(0);
      audioRef.current.src = audioUrls[0];
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrls, autoPlay]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Ensure we're playing the right verse audio
      const url = audioUrls[currentAudioIndex] || audioUrl;
      if (audioRef.current.src !== url) {
        audioRef.current.src = url;
      }
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    currentRepeatRef.current += 1;

    // If we haven't reached the repeat count for this verse, replay
    if (currentRepeatRef.current < repeatCount) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }, 500);
      return;
    }

    // All repeats done for current verse, move to next verse audio
    currentRepeatRef.current = 0;
    const nextIndex = currentAudioIndex + 1;

    if (nextIndex < audioUrls.length) {
      // Play next verse's audio
      setCurrentAudioIndex(nextIndex);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = audioUrls[nextIndex];
          audioRef.current.play().catch(() => {});
        }
      }, 500);
      return;
    }

    // All verses done, reset
    setCurrentAudioIndex(0);

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

  const fetchTafseer = useCallback(async (surah: number, ayah: number) => {
    setTafseerLoading(true);
    setTafseerOpen(true);
    setTafseerVerse(`${surah}:${ayah}`);
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.muyassar`);
      const data = await res.json();
      if (data.code === 200 && data.data?.text) {
        setTafseerText(data.data.text);
      } else {
        setTafseerText("لم يتم العثور على التفسير");
      }
    } catch {
      setTafseerText("حدث خطأ في تحميل التفسير");
    }
    setTafseerLoading(false);
  }, []);

  const handleLongPressStart = useCallback((surah: number, ayah: number) => {
    longPressTimer.current = setTimeout(() => {
      fetchTafseer(surah, ayah);
    }, 600);
  }, [fetchTafseer]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Helper: group tajweed segments by word boundaries
  const getWordsFromTajweed = (tajweedText: string) => {
    const segments = parseTajweed(tajweedText);
    const wordGroups: { segments: { text: string; rule?: string }[] }[] = [{ segments: [] }];
    segments.forEach(seg => {
      const parts = seg.text.split(/( +)/);
      parts.forEach(part => {
        if (/^ +$/.test(part)) {
          wordGroups.push({ segments: [] });
        } else if (part.length > 0) {
          wordGroups[wordGroups.length - 1].segments.push({ text: part, rule: seg.rule });
        }
      });
    });
    return wordGroups.filter(wg => wg.segments.length > 0);
  };

  const primaryVerse = verses[0];
  if (!primaryVerse) return null;

  return (
    <div className="animate-verse-enter w-full max-w-2xl mx-auto">
      {/* Surah Header */}
      <div className="text-center mb-6">
        <div className="inline-block px-6 py-2 rounded-full border backdrop-blur-sm" style={{ backgroundColor: themeCardBg, borderColor: themeAccentColor ? `${themeAccentColor}40` : undefined }}>
          <span className="font-arabic text-lg font-bold" style={{ color: themeAccentColor || 'hsl(var(--gold))' }}>{primaryVerse.surahNameArabic}</span>
          <span className="mx-3" style={{ color: themeMutedText }}>|</span>
          <span className="font-display text-sm font-medium" style={{ color: themeTextColor }}>{primaryVerse.surahName}</span>
        </div>
        <p className="text-sm mt-2 font-semibold" style={{ color: themeTextColor, textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
          سورة {primaryVerse.surahNumber} • آية {primaryVerse.ayahNumber}
          {verses.length > 1 && `–${verses[verses.length - 1].ayahNumber}`}
        </p>
      </div>

      {/* Verse Card */}
      <div
        className="rounded-2xl border p-8 md:p-12 backdrop-blur-sm verse-card-themed"
        style={{
          backgroundColor: themeCardBg,
          borderColor: themeMutedText ? `${themeMutedText}30` : undefined,
          boxShadow: themeAccentColor ? `0 4px 30px ${themeAccentColor}15` : undefined,
          color: themeTextColor,
          opacity: 1,
          '--themed-muted': themeMutedText,
          '--themed-text': themeTextColor,
          '--themed-accent': themeAccentColor,
          '--themed-card-bg': themeCardBg,
        } as React.CSSProperties}
      >
        {/* Verses */}
        {verses.map((v, i) => {
          const isActive = isPlaying && i === currentAudioIndex;
          return (
          <div key={`${v.surahNumber}:${v.ayahNumber}`}>
            {i > 0 && (
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{v.ayahNumber}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            {/* Arabic Text - long press for tafseer */}
            <div
              className={`text-center mb-4 select-none cursor-pointer rounded-xl transition-all duration-300 px-4 py-3`}
              dir="rtl"
              onMouseDown={() => handleLongPressStart(v.surahNumber, v.ayahNumber)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(v.surahNumber, v.ayahNumber)}
              onTouchEnd={handleLongPressEnd}
              onContextMenu={(e) => e.preventDefault()}
            >
              <p
                className="font-arabic leading-[2.2]"
                style={{ fontSize: `${fontSize}px`, color: themeTextColor, textShadow: themeTextColor ? `0 1px 10px ${themeTextColor}22` : undefined }}
              >
                {tajweedMode && v.tajweedText ? (
                  (() => {
                    const wordGroups = getWordsFromTajweed(v.tajweedText);
                    return wordGroups.map((wg, wi) => (
                      <span key={wi}>
                          <span
                          className="inline transition-all duration-500 ease-in-out"
                          style={isActive && activeWordIndex === wi ? { backgroundImage: getReciteGradient(wi), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: `drop-shadow(0 0 8px ${getReciteColor(wi)}50)`, animation: `pulse ${pulseDuration}s cubic-bezier(0.4,0,0.6,1) infinite` } : undefined}
                        >
                          {wg.segments.map((seg, si) => {
                            const rule = seg.rule ? TAJWEED_RULES[seg.rule] : null;
                            return rule ? (
                              <span
                                key={si}
                                style={{ color: isActive && activeWordIndex === wi ? 'inherit' : rule.color, cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTajweedRule(rule);
                                  setTajweedPopupOpen(true);
                                }}
                              >{seg.text}</span>
                            ) : (
                              <span key={si} style={{ color: isActive && activeWordIndex === wi ? 'inherit' : (themeTextColor || undefined) }} className={isActive && activeWordIndex === wi ? '' : ''}>{seg.text}</span>
                            );
                          })}
                        </span>
                        {wi < wordGroups.length - 1 && ' '}
                      </span>
                    ));
                  })()
                ) : (
                  (() => {
                    const words = v.arabic.trim().split(/\s+/);
                    return words.map((word, wi) => (
                      <span key={wi}>
                          <span
                          className={`inline transition-all duration-500 ease-in-out ${isActive && activeWordIndex === wi ? 'animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]' : ''}`}
                          style={isActive && activeWordIndex === wi ? { backgroundImage: getReciteGradient(wi), WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: `drop-shadow(0 0 8px ${getReciteColor(wi)}50)` } : undefined}
                        >
                          {word}
                        </span>
                        {wi < words.length - 1 && ' '}
                      </span>
                    ));
                  })()
                )}
                <span className="inline-flex items-center justify-center text-primary/70 mx-1" style={{ fontSize: `${Math.max(fontSize * 0.55, 14)}px` }}>
                  ﴿{v.ayahNumber.toLocaleString("ar-EG")}﴾
                </span>
              </p>
              <p className="text-xs mt-2" style={{ color: themeMutedText }}>اضغط مطوّلاً للتفسير</p>
            </div>
          </div>
          );
        })}

        {/* Tafseer Dialog */}
        <Dialog open={tafseerOpen} onOpenChange={setTafseerOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-arabic text-lg text-foreground">
                التفسير الميسّر — آية {tafseerVerse}
              </DialogTitle>
            </DialogHeader>
            {tafseerLoading ? (
              <p className="text-muted-foreground text-center py-8 animate-pulse">جاري تحميل التفسير...</p>
            ) : (
              <p className="font-arabic text-base leading-[2] text-foreground">{tafseerText}</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Tajweed Rule Popup */}
        <Dialog open={tajweedPopupOpen} onOpenChange={(open) => { setTajweedPopupOpen(open); if (!open) stopTajweedExample(); }}>
          <DialogContent className="max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-arabic text-lg" style={{ color: selectedTajweedRule?.color }}>
                {selectedTajweedRule?.labelAr}
                <span className="text-muted-foreground text-sm mr-2">({selectedTajweedRule?.label})</span>
              </DialogTitle>
            </DialogHeader>
            {selectedTajweedRule && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">ما هو؟</p>
                  <p className="font-arabic text-sm leading-relaxed text-foreground">{selectedTajweedRule.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">كيف تنطقه؟</p>
                  <p className="font-arabic text-sm leading-relaxed text-foreground">{selectedTajweedRule.howTo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold mb-1">مثال</p>
                  <p className="font-arabic text-base text-foreground" style={{ color: selectedTajweedRule.color }}>{selectedTajweedRule.example}</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground font-semibold mb-2">🔊 استمع للمثال (آية {selectedTajweedRule.exampleRef})</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => tajweedAudioPlaying ? stopTajweedExample() : playTajweedExample(selectedTajweedRule.exampleRef)}
                    disabled={tajweedAudioLoading}
                  >
                    {tajweedAudioLoading ? (
                      <><Volume2 className="w-4 h-4 animate-pulse" /> جاري التحميل...</>
                    ) : tajweedAudioPlaying ? (
                      <><Pause className="w-4 h-4" /> إيقاف</>
                    ) : (
                      <><Play className="w-4 h-4" /> تشغيل المثال</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Divider before controls */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 rounded-full bg-gold" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Settings Row */}
        <div className="space-y-4">
          {/* Font size + verse count + tajweed */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Font size */}
            <div className="flex items-center gap-2 min-w-[180px]">
              <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">حجم الخط</span>
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

            {/* Tajweed */}
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="tajweed" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">تجويد</Label>
              <Switch id="tajweed" checked={tajweedMode} onCheckedChange={setTajweedMode} className="scale-75" />
            </div>

            {/* Verse count */}
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">آيات</span>
              <Select value={String(verseCount)} onValueChange={(v) => onVerseCountChange(parseInt(v))}>
                <SelectTrigger className="w-16 h-8 bg-background text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">١</SelectItem>
                  <SelectItem value="2">٢</SelectItem>
                  <SelectItem value="3">٣</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tajweed Legend */}
          {tajweedMode && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-2">
              {Object.entries(TAJWEED_RULES).map(([key, rule]) => (
                <span key={key} className="flex items-center gap-1 text-[10px]">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: rule.color }} />
                  <span className="text-muted-foreground">{rule.labelAr}</span>
                </span>
              ))}
            </div>
          )}

          {/* Repeat count */}
          <div className="flex items-center justify-center gap-2">
            <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">تكرار</span>
            <Select value={String(repeatCount)} onValueChange={(v) => setRepeatCount(parseInt(v))}>
              <SelectTrigger className="w-16 h-8 bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">١</SelectItem>
                <SelectItem value="2">٢</SelectItem>
                <SelectItem value="3">٣</SelectItem>
                <SelectItem value="5">٥</SelectItem>
                <SelectItem value="7">٧</SelectItem>
                <SelectItem value="10">١٠</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto-play toggle + delay */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="autoplay" className="text-xs text-muted-foreground cursor-pointer">تقدّم تلقائي</Label>
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

          {/* Countdown with pause */}
          {countdown !== null && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-muted-foreground animate-pulse">
                الآية التالية بعد {countdown} ثانية...
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs gap-1.5 rounded-full"
                onClick={() => {
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                  setCountdown(null);
                }}
              >
                <Pause className="w-3 h-3" />
                إيقاف مؤقت
              </Button>
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
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border hover:bg-primary/10"
              onClick={async () => {
                for (let i = 0; i < audioUrls.length; i++) {
                  const url = audioUrls[i];
                  const v = verses[i] || verses[0];
                  try {
                    const res = await fetch(url);
                    const blob = await res.blob();
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `${v.surahNumber}_${v.ayahNumber}_${selectedReciter}.mp3`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  } catch {}
                }
              }}
              title="تحميل الصوت"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={audioUrls[0] || audioUrl}
          onEnded={() => { handleEnded(); setActiveWordIndex(null); }}
          onPause={() => { setIsPlaying(false); isPlayingRef.current = false; setActiveWordIndex(null); }}
          onPlay={() => { setIsPlaying(true); isPlayingRef.current = true; }}
          onTimeUpdate={() => {
            if (!audioRef.current || !isPlayingRef.current) return;
            const { currentTime, duration } = audioRef.current;
            if (!duration || isNaN(duration)) return;
            const currentVerse = verses[currentAudioIndex];
            if (!currentVerse) return;
            const words = currentVerse.arabic.trim().split(/\s+/);
            const totalChars = words.reduce((s, w) => s + w.length, 0);
            const wordDurationSec = duration / words.length;
            // Faster recitation = faster pulse (clamp between 0.4s and 2s)
            setPulseDuration(Math.max(0.4, Math.min(2, wordDurationSec * 0.8)));
            let acc = 0;
            for (let i = 0; i < words.length; i++) {
              acc += words[i].length;
              if (currentTime / duration <= acc / totalChars) {
                setActiveWordIndex(i);
                return;
              }
            }
            setActiveWordIndex(words.length - 1);
          }}
        />
      </div>
    </div>
  );
};

export default VerseCard;
