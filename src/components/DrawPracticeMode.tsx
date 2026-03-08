import { useState, useEffect, useRef, useCallback } from "react";
import { SkipForward, SkipBack, RotateCcw, CheckCircle2, Eraser, Send, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

const splitWords = (text: string): string[] => {
  return text.split(/\s+/).filter(Boolean);
};

const DrawPracticeMode = ({ verses, onNext, onPrev }: DrawPracticeModeProps) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [verseComplete, setVerseComplete] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showVerse, setShowVerse] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentVerse = verses[currentVerseIndex] || verses[0];
  const words = currentVerse ? splitWords(currentVerse.arabic) : [];
  const currentWord = words[revealedCount] || "";

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

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    setIsDrawing(true);
    setFeedback(null);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground")
      ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim()})`
      : "#fff";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
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
    if (!canvas || !currentWord) return;

    setIsChecking(true);
    setFeedback(null);

    try {
      // Convert canvas to base64
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1];

      const { data, error } = await supabase.functions.invoke("recognize-handwriting", {
        body: { imageBase64: base64, expectedWord: currentWord },
      });

      if (error) throw error;

      if (data?.match) {
        setFeedback("correct");
        const newCount = revealedCount + 1;
        setRevealedCount(newCount);
        if (newCount >= words.length) {
          setVerseComplete(true);
        } else {
          // Clear canvas for next word after a brief delay
          setTimeout(() => {
            clearCanvas();
            setFeedback(null);
          }, 800);
        }
      } else {
        setFeedback("incorrect");
      }
    } catch (err) {
      console.error("Recognition error:", err);
      setFeedback("incorrect");
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
        <div className="w-full h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${words.length > 0 ? (revealedCount / words.length) * 100 : 0}%` }}
          />
        </div>

        {/* Words display - only show revealed words */}
        <div className="text-center mb-4 select-none" dir="rtl">
          <p className="font-arabic leading-[2.4] text-2xl md:text-3xl">
            {words.map((word, i) => (
              <span
                key={i}
                className={`inline-block mx-1 transition-all duration-300 ${
                  i < revealedCount
                    ? "text-foreground"
                    : "text-transparent"
                }`}
              >
                {i < revealedCount ? word : "ـــ"}
              </span>
            ))}
          </p>
        </div>

        {/* Current word hint - hidden */}
        {!verseComplete && (
          <div className="text-center mb-4">
            <p className="text-xs text-muted-foreground">ارسم الكلمة التالية</p>
            <span className="text-sm text-muted-foreground">كلمة {revealedCount + 1} من {words.length}</span>
          </div>
        )}

        {/* Canvas */}
        {!verseComplete && (
          <div className="relative mb-4">
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
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
            ارسم الكلمة ثم اضغط زر الإرسال للتحقق
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
