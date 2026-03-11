import { useState, useEffect, useRef, useCallback } from "react";
import { SkipForward, SkipBack, RotateCcw, CheckCircle2, Eye, EyeOff, Eraser, Loader2, PenTool, Keyboard, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

interface TypePracticeModeProps {
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

const TypePracticeMode = ({ verses, onNext, onPrev, onCorrectWord }: TypePracticeModeProps) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [verseComplete, setVerseComplete] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [showVerse, setShowVerse] = useState(false);
  const [checkMode, setCheckMode] = useState<CheckMode>("word");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<"keyboard" | "draw">("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasDrawn = useRef(false);
  const autoRecognizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    setRevealedCount(0);
    setVerseComplete(false);
    setCurrentVerseIndex(0);
  }, [verses]);

  useEffect(() => {
    setRevealedCount(0);
    setVerseComplete(false);
    setFeedback(null);
    setInputValue("");
    setSuggestions([]);
    setRecognizedText("");
    clearCanvas();
  }, [currentVerseIndex]);

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
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const normalizedInput = normalizeArabic(input);
    const inputWords = splitWords(input);
    const wordCount = inputWords.length;

    const remaining = words.slice(revealedCount);
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

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setFeedback(null);
    updateSuggestions(val);
  };

  const checkWord = useCallback((text?: string) => {
    const toCheck = text || inputValue;
    if (!toCheck.trim() || !currentWord) return;

    const normalizedInput = normalizeArabic(toCheck);
    const expectedText = getExpectedText();
    const normalizedExpected = normalizeArabic(expectedText);

    if (normalizedInput === normalizedExpected) {
      setFeedback("correct");
      const wordsToReveal = getWordsToReveal();
      for (let i = 0; i < wordsToReveal; i++) onCorrectWord?.();
      const newCount = revealedCount + wordsToReveal;
      setRevealedCount(newCount);
      setInputValue("");
      setSuggestions([]);
      setRecognizedText("");
      clearCanvas();
      if (newCount >= words.length) {
        setVerseComplete(true);
      } else {
        setTimeout(() => setFeedback(null), 600);
        if (inputMode === "keyboard") setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      setFeedback("incorrect");
      // Show suggestions from verse for the recognized text
      updateSuggestions(toCheck);
      setTimeout(() => {
        setFeedback(null);
      }, 1200);
    }
  }, [inputValue, currentWord, revealedCount, words.length, onCorrectWord, inputMode, updateSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkWord();
    }
  };

  const backspaceWord = () => {
    const currentWords = splitWords(inputValue);
    if (currentWords.length > 0) {
      currentWords.pop();
      const newVal = currentWords.join(" ") + (currentWords.length > 0 ? " " : "");
      handleInputChange(newVal);
      // Refocus input after button click
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const selectSuggestion = (phrase: string) => {
    setInputValue(phrase);
    setSuggestions([]);
    setRecognizedText("");
    if (canvasRef.current) clearCanvas();

    const phraseWords = splitWords(phrase);
    const wordsToAdvance = phraseWords.length;

    setTimeout(() => {
      setFeedback("correct");
      for (let i = 0; i < wordsToAdvance; i++) onCorrectWord?.();
      const newCount = revealedCount + wordsToAdvance;
      setRevealedCount(newCount);
      setInputValue("");
      if (newCount >= words.length) {
        setVerseComplete(true);
      } else {
        setTimeout(() => setFeedback(null), 600);
        if (inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, 50);
  };

  const skipWord = () => {
    const skip = getWordsToReveal();
    const newCount = revealedCount + skip;
    setRevealedCount(newCount);
    setInputValue("");
    setSuggestions([]);
    setRecognizedText("");
    setFeedback(null);
    clearCanvas();
    if (newCount >= words.length) {
      setVerseComplete(true);
    }
    if (inputMode === "keyboard") inputRef.current?.focus();
  };

  const resetPractice = () => {
    setRevealedCount(0);
    setVerseComplete(false);
    setFeedback(null);
    setInputValue("");
    setSuggestions([]);
    setRecognizedText("");
    clearCanvas();
    if (inputMode === "keyboard") inputRef.current?.focus();
  };

  // --- Canvas drawing logic ---
  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
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
    hasDrawn.current = true;
    if (autoRecognizeTimer.current) clearTimeout(autoRecognizeTimer.current);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#ffffff";

    if (lastPos.current) {
      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        const steps = Math.max(1, Math.floor(dist / 2));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          ctx.lineTo(lastPos.current.x + dx * t, lastPos.current.y + dy * t);
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
    // Auto-recognize after 1.5s of no drawing
    if (hasDrawn.current && !verseComplete) {
      if (autoRecognizeTimer.current) clearTimeout(autoRecognizeTimer.current);
      autoRecognizeTimer.current = setTimeout(() => {
        recognizeDrawing();
      }, 1500);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    setRecognizedText("");
  };

  const recognizeDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecognizing) return;
    setIsRecognizing(true);

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1];

      const { data, error } = await supabase.functions.invoke("recognize-handwriting", {
        body: { imageBase64: base64, expectedWord: currentWord, checkMode: "word" },
      });

      if (error) throw error;

      const recognized = data?.recognized || "";
      if (recognized) {
        setRecognizedText(recognized);
        setInputValue(recognized);
        updateSuggestions(recognized);

        // Auto-check: if recognized text matches, mark correct
        const normalizedRecognized = normalizeArabic(recognized);
        const normalizedExpected = normalizeArabic(currentWord);
        if (normalizedRecognized === normalizedExpected || data?.match) {
          setTimeout(() => checkWord(recognized), 200);
        }
      }
    } catch (err) {
      console.error("Recognition error:", err);
    } finally {
      setIsRecognizing(false);
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

        {/* Input mode toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <Button
            variant={inputMode === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => setInputMode("draw")}
            className="gap-1.5 text-xs"
          >
            <PenTool className="w-3.5 h-3.5" />
            رسم
          </Button>
          <Button
            variant={inputMode === "keyboard" ? "default" : "outline"}
            size="sm"
            onClick={() => { setInputMode("keyboard"); setTimeout(() => inputRef.current?.focus(), 100); }}
            className="gap-1.5 text-xs"
          >
            <Keyboard className="w-3.5 h-3.5" />
            لوحة مفاتيح
          </Button>
        </div>

        {/* Check mode selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-emerald/10 pb-3">
          <span className="text-[10px] text-muted-foreground ml-1">وضع التحقق:</span>
          <div className="flex gap-1">
            {(Object.keys(CHECK_MODE_LABELS) as CheckMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setCheckMode(mode)}
                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${checkMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                {CHECK_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>

        {/* Show/Hide toggle */}
        <div className="flex justify-center mb-2">
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
        <div className="text-center mb-2 select-none" dir="rtl">
          <p className="font-arabic leading-[1.8] text-lg md:text-xl">
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
                  style={{ filter: !showVerse && i >= revealedCount + getWordsToReveal() - 1 ? "blur(0px)" : i > revealedCount + getWordsToReveal() - 1 ? "blur(2px)" : "none" }}
                >
                  {i < revealedCount ? word : showVerse ? word : "ـــ"}
                </span>
              );
            })}
          </p>
        </div>

        {/* Current word hint */}
        {!verseComplete && (
          <div className="text-center mb-2">
            <p className="text-[10px] text-muted-foreground">
              {inputMode === "draw" ? "ارسم " : "اكتب "}
              {checkMode === "word" ? "الكلمة التالية" :
                checkMode === "2words" ? "الكلمتين التاليتين" :
                  checkMode === "half" ? "نصف الآية" : "الآية كاملة"}
            </p>
            <p className="text-xs text-muted-foreground">
              {checkMode === "word"
                ? `كلمة ${revealedCount + 1} من ${words.length}`
                : `${words.length - revealedCount} كلمات متبقية`}
            </p>
          </div>
        )}

        {/* Input area */}
        {!verseComplete && (
          <div className="mb-4">
            {inputMode === "draw" ? (
              <>
                {/* Drawing canvas */}
                <div className="relative mx-auto max-w-[400px]">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
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
                      <CheckCircle2 className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                  )}
                  {isRecognizing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-background/30 rounded-xl">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  )}
                </div>

                {/* Canvas controls */}
                <div className="flex justify-center gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={clearCanvas} className="gap-1 text-xs text-muted-foreground">
                    <Eraser className="w-3.5 h-3.5" />
                    مسح
                  </Button>
                </div>

                {/* Recognized text display */}
                {recognizedText && (
                  <div className="text-center mt-3">
                    <p className="text-xs text-muted-foreground mb-1">النص المتعرف عليه:</p>
                    <p className="font-arabic text-lg text-foreground" dir="rtl">{recognizedText}</p>
                  </div>
                )}
              </>
            ) : (
              /* Keyboard input */
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex justify-end w-full max-w-2xl px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={backspaceWord}
                    disabled={!inputValue.trim()}
                    className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Delete className="w-5 h-5" />
                    <span className="text-xs">حذف الكلمة</span>
                  </Button>
                </div>
                <textarea
                  ref={inputRef}
                  dir="rtl"
                  lang="ar"
                  rows={3}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب هنا..."
                  className={`w-full max-w-2xl px-6 py-4 rounded-2xl border-4 bg-muted/40 font-arabic text-3xl text-center outline-none transition-all resize-none ${feedback === "correct"
                    ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(var(--primary),0.2)] scale-[1.01]"
                    : feedback === "incorrect"
                      ? "border-destructive bg-destructive/10 animate-shake"
                      : "border-border/60 focus:border-primary/50 focus:shadow-[0_0_20px_rgba(var(--primary),0.1)] focus:bg-muted/60"
                    }`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Suggestions from verse */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s)}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-arabic text-base hover:bg-primary/20 transition-colors border border-primary/20"
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
            <Button
              variant="outline"
              size="sm"
              onClick={skipWord}
              className="rounded-full border-border hover:bg-primary/10 px-4 gap-2"
              title="تخطي"
            >
              <SkipForward className="w-4 h-4" />
              <span className="text-xs">تخطي</span>
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => onNext()} className="rounded-full border-border hover:bg-primary/10 px-4 gap-2">
            <SkipForward className="w-4 h-4" />
            <span className="text-xs">التالي</span>
          </Button>
        </div>

        {!verseComplete && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            {inputMode === "draw"
              ? "ارسم الكلمة وسيتم التعرف عليها تلقائياً ومطابقتها مع الآية"
              : "اكتب الكلمة ثم اضغط Enter للتحقق"}
          </p>
        )}
      </Card>
    </div>
  );
};

export default TypePracticeMode;
