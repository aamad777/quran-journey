import { useState, useEffect, useRef, useCallback } from "react";
import { SkipForward, SkipBack, RotateCcw, CheckCircle2, Eraser, Send, Loader2, Eye, EyeOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { normalizeArabic } from "@/lib/arabicUtils";

interface VerseData {
  arabic: string;
  tajweedText: string;
  surahName: string;
  surahNameArabic: string;
  surahNumber: number;
  ayahNumber: number;
}

interface DrawPracticeModeProps {
  verses: VerseData[];
  onNext: () => void;
  onPrev: () => void;
  onCorrectWord?: () => void;
}

type CheckMode = "word" | "2words" | "half" | "full";

const CHECK_MODE_LABELS: Record<CheckMode, string> = {
  word: "كلمة",
  "2words": "كلمتين",
  half: "نصف آية",
  full: "آية كاملة",
};

const splitWords = (text: string): string[] => {
  return text.split(/\s+/).filter(Boolean);
};

const DrawPracticeMode = ({ verses, onNext, onPrev, onCorrectWord }: DrawPracticeModeProps) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [verseComplete, setVerseComplete] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showVerse, setShowVerse] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [autoCheck, setAutoCheck] = useState(false);
  const [canvasScale, setCanvasScale] = useState(70); // 30-100 percent
  const [checkMode, setCheckMode] = useState<CheckMode>("word");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recognizedText, setRecognizedText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDrawn = useRef(false);

  const currentVerse = verses[currentVerseIndex] || verses[0];
  const words = currentVerse ? splitWords(currentVerse.arabic) : [];
  const currentWord = words[revealedCount] || "";

  // Get expected text based on check mode
  const getExpectedText = (): string => {
    switch (checkMode) {
      case "word":
        return currentWord;
      case "2words":
        return words.slice(revealedCount, revealedCount + 2).join(" ");
      case "half": {
        const halfLen = Math.ceil(words.length / 2);
        const start = revealedCount;
        const end = Math.min(start + halfLen, words.length);
        return words.slice(start, end).join(" ");
      }
      case "full":
        return words.slice(revealedCount).join(" ");
      default:
        return currentWord;
    }
  };

  const getWordsToReveal = (): number => {
    switch (checkMode) {
      case "word": return 1;
      case "2words": return Math.min(2, words.length - revealedCount);
      case "half": return Math.min(Math.ceil(words.length / 2), words.length - revealedCount);
      case "full": return words.length - revealedCount;
      default: return 1;
    }
  };

  // Reset state when verse changes
  useEffect(() => {
    setRevealedCount(0);
    setVerseComplete(false);
    setCurrentVerseIndex(0);
  }, [verses]);

  useEffect(() => {
    setRevealedCount(0);
    setVerseComplete(false);
    setFeedback(null);
    clearCanvas();
  }, [currentVerseIndex]);

  // Auto-advance when all words revealed
  useEffect(() => {
    if (verseComplete) {
      autoAdvanceTimer.current = setTimeout(() => {
        if (currentVerseIndex < verses.length - 1) {
          setCurrentVerseIndex((i) => i + 1);
        } else {
          onNext();
        }
      }, 1500);
    }
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [verseComplete, currentVerseIndex, verses.length, onNext]);

  // Generate suggestions from remaining verse words based on input
  const updateSuggestions = useCallback((input: string) => {
    const remaining = words.slice(revealedCount);

    if (!input.trim()) {
      // Provide next 1, 2, and 3 words as default suggestions when input is empty
      const defaults: string[] = [];
      if (remaining.length >= 1) defaults.push(remaining[0]);
      if (remaining.length >= 2) defaults.push(remaining.slice(0, 2).join(" "));
      if (remaining.length >= 3) defaults.push(remaining.slice(0, 3).join(" "));
      setSuggestions(defaults);
      return;
    }

    const normalizedInput = normalizeArabic(input);
    const inputWords = splitWords(input);
    const wordCount = inputWords.length;

    // Generate phrases from remaining words that match the input word count
    const phrases: string[] = [];
    for (let i = 0; i < remaining.length; i++) {
      const phrase = remaining.slice(i, i + wordCount).join(" ");
      if (phrase) phrases.push(phrase);
    }

    const matches = phrases.filter((p) => {
      const np = normalizeArabic(p);
      return np.startsWith(normalizedInput) || normalizedInput.startsWith(np) || np.includes(normalizedInput);
    });
    const unique = [...new Set(matches)].slice(0, 5);
    setSuggestions(unique);
  }, [words, revealedCount]);

  useEffect(() => {
    updateSuggestions("");
  }, [revealedCount, currentVerseIndex, words, updateSuggestions]);

  const selectSuggestion = (phrase: string) => {
    setSuggestions([]);
    setRecognizedText("");
    clearCanvas();

    const phraseWords = splitWords(phrase);
    const wordsToAdvance = phraseWords.length;

    // Use timeout to allow states to clear before next check
    setTimeout(() => {
      setFeedback("correct");
      for (let i = 0; i < wordsToAdvance; i++) onCorrectWord?.();
      const newCount = revealedCount + wordsToAdvance;
      setRevealedCount(newCount);
      if (newCount >= words.length) {
        setVerseComplete(true);
      } else {
        setTimeout(() => setFeedback(null), 600);
      }
    }, 50);
  };

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    return ctx;
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const canvasWidth = Math.round(300 + (canvasScale / 100) * 500); // 300-800
  const canvasHeight = Math.round(200 + (canvasScale / 100) * 300); // 200-500

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    setIsDrawing(true);
    setFeedback(null);
    hasDrawn.current = true;
    if (autoCheckTimer.current) clearTimeout(autoCheckTimer.current);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    const effectiveSize = Math.max(1, brushSize);
    ctx.lineWidth = effectiveSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;

    // Interpolate between points for ultra-smooth stylus strokes
    if (lastPos.current) {
      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Add intermediate points for large gaps (common with fast stylus movement)
      if (dist > 2) {
        const steps = Math.max(1, Math.floor(dist / 2));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const ix = lastPos.current.x + dx * t;
          const iy = lastPos.current.y + dy * t;
          ctx.lineTo(ix, iy);
        }
      }
      const midX = (lastPos.current.x + pos.x) / 2;
      const midY = (lastPos.current.y + pos.y) / 2;
      ctx.quadraticCurveTo(lastPos.current.x, lastPos.current.y, midX, midY);
    } else {
      ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
  };

  const endDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
    if (autoCheck && hasDrawn.current && !verseComplete) {
      if (autoCheckTimer.current) clearTimeout(autoCheckTimer.current);
      autoCheckTimer.current = setTimeout(() => {
        checkDrawing();
      }, 1500);
    }
  };


  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFeedback(null);
  };

  const checkDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isChecking) return;

    const expectedText = getExpectedText();
    if (!expectedText) return;

    setIsChecking(true);
    setFeedback(null);
    setRecognizedText("");
    setSuggestions([]);
    hasDrawn.current = false;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1];

      const { data, error } = await supabase.functions.invoke("recognize-handwriting", {
        body: { imageBase64: base64, expectedWord: expectedText, checkMode },
      });

      if (error) throw error;

      const recognized = data?.recognized || "";
      if (recognized) {
        setRecognizedText(recognized);
        updateSuggestions(recognized);
      }

      if (data?.match) {
        setFeedback("correct");
        const wordsToReveal = getWordsToReveal();
        for (let i = 0; i < wordsToReveal; i++) onCorrectWord?.();
        const newCount = revealedCount + wordsToReveal;
        setRevealedCount(newCount);
        if (newCount >= words.length) {
          setVerseComplete(true);
        } else {
          setTimeout(() => {
            clearCanvas();
            setFeedback(null);
          }, 800);
        }
      } else {
        setFeedback("incorrect");
        setTimeout(() => {
          clearCanvas();
          setFeedback(null);
        }, 1200);
      }
    } catch (err) {
      console.error("Recognition error:", err);
      setFeedback("incorrect");
      setTimeout(() => {
        clearCanvas();
        setFeedback(null);
      }, 1200);
    } finally {
      setIsChecking(false);
    }
  };

  const resetPractice = () => {
    setRevealedCount(0);
    setVerseComplete(false);
    setFeedback(null);
    clearCanvas();
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
          سورة {primaryVerse.surahNumber} • آية {currentVerse.ayahNumber}
        </p>
      </div>

      {/* Practice Card */}
      <Card className="p-4 md:p-6 shadow-xl border-emerald/20 islamic-pattern bg-card/95 backdrop-blur-sm">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">
            {revealedCount} / {words.length} كلمات
          </span>
          {verseComplete && (
            <span className="flex items-center gap-1 text-xs text-primary font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              أحسنت!
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-muted mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${words.length > 0 ? (revealedCount / words.length) * 100 : 0}%` }}
          />
        </div>

        {/* Settings Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-emerald/10 pb-3">
          {/* Check mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">وضع التحقق:</span>
            <div className="flex gap-1">
              {(Object.keys(CHECK_MODE_LABELS) as CheckMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCheckMode(mode)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${checkMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {CHECK_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>
          {/* Auto-check toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">تحقق تلقائي</span>
            <Switch checked={autoCheck} onCheckedChange={setAutoCheck} className="scale-75" />
          </div>
        </div>

        {/* Show/Hide toggle */}
        <div className="flex justify-center mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVerse(!showVerse)}
            className="gap-2 text-muted-foreground"
          >
            {showVerse ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showVerse ? "إخفاء الآية" : "إظهار الآية"}
          </Button>
        </div>

        {/* Arabic verse display (The output) */}
        <div className="text-center mb-3 select-none" dir="rtl">
          <p className="font-arabic leading-[1.8] text-2xl md:text-3xl">
            {words.map((word, i) => {
              const isInCurrentChunk = i >= revealedCount && i < revealedCount + getWordsToReveal();
              return (
                <span
                  key={i}
                  className={`inline-block mx-1 transition-all duration-300 ${i < revealedCount
                    ? "text-foreground"
                    : showVerse
                      ? isInCurrentChunk
                        ? "text-primary font-bold border-b-2 border-primary pb-1"
                        : "text-muted-foreground/30"
                      : "text-transparent"
                    }`}
                  style={{ filter: !showVerse && i >= revealedCount ? "blur(0px)" : i > revealedCount + getWordsToReveal() - 1 ? "blur(2px)" : "none" }}
                >
                  {i < revealedCount ? word : showVerse ? word : "ـــ"}
                </span>
              );
            })}
          </p>
        </div>

        {/* Current word hint */}
        {!verseComplete && (
          <div className="text-center mb-3">
            <p className="text-[10px] text-muted-foreground">
              {checkMode === "word" ? "ارسم الكلمة التالية" :
                checkMode === "2words" ? "ارسم الكلمتين التاليتين" :
                  checkMode === "half" ? "ارسم نصف الآية" : "ارسم الآية كاملة"}
            </p>
            <p className="text-xs text-muted-foreground">
              {checkMode === "word"
                ? `كلمة ${revealedCount + 1} من ${words.length}`
                : `${getWordsToReveal()} كلمات متبقية`}
            </p>
          </div>
        )}

        {/* Canvas + Brush Size */}
        {!verseComplete && (
          <div className="mb-4">
            {/* Brush size & color control */}
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">القلم</span>
                <div className="flex items-center gap-1.5">
                  {[1.5, 4, 8].map((size) => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`rounded-full transition-all duration-150 ${brushSize === size ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : 'opacity-40 hover:opacity-70'}`}
                      style={{
                        width: Math.max(8, size * 1.2 + 4),
                        height: Math.max(8, size * 1.2 + 4),
                        backgroundColor: brushColor,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">اللون</span>
                <div className="flex gap-1">
                  {["#ffffff", "#f59e0b", "#22c55e", "#3b82f6", "#ef4444"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={`w-5 h-5 rounded-full border transition-all ${brushColor === color ? 'ring-2 ring-primary ring-offset-1 ring-offset-card scale-110' : 'opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: color, borderColor: color === "#ffffff" ? "hsl(var(--border))" : color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas Scale Slider */}
            <div className="flex items-center justify-center gap-2 mb-3 px-4">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">الحجم</span>
              <Slider
                value={[canvasScale]}
                onValueChange={(v) => { setCanvasScale(v[0]); clearCanvas(); }}
                min={30}
                max={100}
                step={5}
                className="w-32"
              />
              <span className="text-[10px] text-muted-foreground w-8">{canvasScale}%</span>
            </div>

            {/* Canvas */}
            <div className="relative mx-auto" style={{ maxWidth: `${canvasWidth}px` }}>
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className={`w-full rounded-xl border-2 cursor-crosshair touch-none ${feedback === "correct"
                  ? "border-primary bg-primary/5"
                  : feedback === "incorrect"
                    ? "border-destructive bg-destructive/5"
                    : "border-border bg-muted/30"
                  }`}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {feedback === "correct" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <CheckCircle2 className="w-12 h-12 text-primary animate-pulse" />
                </div>
              )}
            </div>

            {/* Recognized text display */}
            {recognizedText && (
              <div className="text-center mt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">توقعنا للرسم:</p>
                <div className="inline-block px-4 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                  <p className="font-arabic text-2xl text-foreground" dir="rtl">{recognizedText}</p>
                </div>
              </div>
            )}

            {/* Suggestions from verse */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-4 animate-in fade-in zoom-in-95 duration-400">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s)}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-arabic text-lg hover:bg-primary/20 transition-all border border-primary/20 hover:scale-105 active:scale-95 shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback text */}
        {feedback === "incorrect" && (
          <p className="text-center text-sm text-destructive mb-4">حاول مرة أخرى</p>
        )}

        {verseComplete && (
          <p className="text-center text-sm text-muted-foreground mb-4 animate-pulse">
            الانتقال للآية التالية...
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-3">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 rounded-full bg-gold" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Controls - mobile labeled */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Back */}
          <button onClick={() => onPrev()} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-border hover:bg-primary/10 transition-all min-w-[52px]">
            <SkipBack className="w-4 h-4" />
            <span className="text-[10px] text-muted-foreground">رجوع</span>
          </button>

          {/* Reset */}
          <button onClick={resetPractice} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-border hover:bg-primary/10 transition-all min-w-[52px]">
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px] text-muted-foreground">إعادة</span>
          </button>

          {!verseComplete && (
            <>
              {/* Erase canvas */}
              <button onClick={clearCanvas} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-border hover:bg-primary/10 transition-all min-w-[52px]">
                <Eraser className="w-4 h-4" />
                <span className="text-[10px] text-muted-foreground">مسح</span>
              </button>

              {/* Skip */}
              <button
                onClick={() => {
                  const skip = getWordsToReveal();
                  const newCount = revealedCount + skip;
                  setRevealedCount(newCount);
                  clearCanvas();
                  if (newCount >= words.length) {
                    setVerseComplete(true);
                  }
                }}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-border hover:bg-primary/10 transition-all min-w-[52px]"
              >
                <SkipForward className="w-4 h-4" />
                <span className="text-[10px] text-muted-foreground">تخطي</span>
              </button>

              {/* Check/Send */}
              <button
                onClick={checkDrawing}
                disabled={isChecking}
                className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl gradient-islamic text-gold hover:opacity-90 transition-all min-w-[52px] disabled:opacity-50"
              >
                {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="text-[10px]">إرسال</span>
              </button>
            </>
          )}

          {/* Next */}
          <button onClick={() => onNext()} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-border hover:bg-primary/10 transition-all min-w-[52px]">
            <SkipForward className="w-4 h-4" />
            <span className="text-[10px] text-muted-foreground">التالي</span>
          </button>
        </div>

        {!verseComplete && !isChecking && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            {autoCheck ? "ارسم وسيتم التحقق تلقائياً" : "ارسم ثم اضغط زر الإرسال للتحقق"}
          </p>
        )}
        {isChecking && (
          <p className="text-center text-xs text-muted-foreground mt-4 animate-pulse">
            جارٍ التحقق...
          </p>
        )}
      </Card>
    </div>
  );
};

export default DrawPracticeMode;
