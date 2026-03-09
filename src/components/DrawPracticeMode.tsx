import { useState, useEffect, useRef, useCallback } from "react";
import { SkipForward, SkipBack, RotateCcw, CheckCircle2, Eraser, Send, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

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
  const [brushSize, setBrushSize] = useState(6);
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [autoCheck, setAutoCheck] = useState(false);
  const [canvasSize, setCanvasSize] = useState<"small" | "medium" | "large">("medium");
  const [checkMode, setCheckMode] = useState<CheckMode>("word");
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

  const canvasDimensions = {
    small: { width: 400, height: 250 },
    medium: { width: 600, height: 350 },
    large: { width: 800, height: 500 },
  };

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
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;

    // Interpolate between last position for smoother strokes (helps with stylus/pen)
    if (lastPos.current) {
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
    hasDrawn.current = false;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1];

      const { data, error } = await supabase.functions.invoke("recognize-handwriting", {
        body: { imageBase64: base64, expectedWord: expectedText, checkMode },
      });

      if (error) throw error;

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
      <div className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-gold">
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
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-4 text-xs">
          {/* Check mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">وضع التحقق:</span>
            <div className="flex gap-1">
              {(Object.keys(CHECK_MODE_LABELS) as CheckMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCheckMode(mode)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    checkMode === mode
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
        <div className="flex justify-center mb-4">
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

        {/* Words display */}
        <div className="text-center mb-4 select-none" dir="rtl">
          <p className="font-arabic leading-[2.4] text-2xl md:text-3xl">
            {words.map((word, i) => {
              const isInCurrentChunk = i >= revealedCount && i < revealedCount + getWordsToReveal();
              return (
                <span
                  key={i}
                  className={`inline-block mx-1 transition-all duration-300 ${
                    i < revealedCount
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
          <div className="text-center mb-4">
            <p className="text-xs text-muted-foreground">
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
            {/* Brush size control */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-[10px] text-muted-foreground">القلم</span>
              <div className="flex items-center gap-1.5">
                {[3, 6, 10, 16].map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`rounded-full transition-all duration-150 ${brushSize === size ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : 'opacity-40 hover:opacity-70'}`}
                    style={{
                      width: Math.max(8, size * 1.2 + 4),
                      height: Math.max(8, size * 1.2 + 4),
                      backgroundColor: 'hsl(var(--foreground))',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Canvas size control */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-[10px] text-muted-foreground">الحجم</span>
              <div className="flex gap-1">
                {(["small", "medium", "large"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setCanvasSize(s); clearCanvas(); }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                      canvasSize === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s === "small" ? "صغير" : s === "medium" ? "متوسط" : "كبير"}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas */}
            <div className={`relative mx-auto ${canvasSize === "small" ? "max-w-[320px]" : canvasSize === "medium" ? "max-w-[480px]" : "max-w-full"}`}>
              <canvas
                ref={canvasRef}
                width={canvasDimensions[canvasSize].width}
                height={canvasDimensions[canvasSize].height}
                className={`w-full rounded-xl border-2 cursor-crosshair touch-none ${
                  feedback === "correct"
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
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 rounded-full bg-gold" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" onClick={() => onPrev()} className="rounded-full border-border hover:bg-primary/10">
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={resetPractice} className="rounded-full border-border hover:bg-primary/10">
            <RotateCcw className="w-4 h-4" />
          </Button>

          {!verseComplete && (
            <>
              <Button variant="outline" size="icon" onClick={clearCanvas} className="rounded-full border-border hover:bg-primary/10">
                <Eraser className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const skip = getWordsToReveal();
                  const newCount = revealedCount + skip;
                  setRevealedCount(newCount);
                  clearCanvas();
                  if (newCount >= words.length) {
                    setVerseComplete(true);
                  }
                }}
                className="rounded-full border-border hover:bg-primary/10"
                title="تخطي"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <Button
                onClick={checkDrawing}
                disabled={isChecking}
                size="icon"
                className="w-14 h-14 rounded-full gradient-islamic text-gold hover:opacity-90 transition-all"
              >
                {isChecking ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </Button>
            </>
          )}

          <Button variant="outline" size="icon" onClick={() => onNext()} className="rounded-full border-border hover:bg-primary/10">
            <SkipForward className="w-4 h-4" />
          </Button>
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
      </div>
    </div>
  );
};

export default DrawPracticeMode;
