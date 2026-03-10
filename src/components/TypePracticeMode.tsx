import { useState, useEffect, useRef, useCallback } from "react";
import { SkipForward, SkipBack, RotateCcw, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const normalizeArabic = (text: string): string => {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, "")
    .replace(/\u0671/g, "\u0627")
    .replace(/[\u0622\u0623\u0625]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .trim();
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentVerse = verses[currentVerseIndex] || verses[0];
  const words = currentVerse ? splitWords(currentVerse.arabic) : [];
  const currentWord = words[revealedCount] || "";

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
    const remaining = words.slice(revealedCount);
    // Filter words that start with the normalized input
    const matches = remaining.filter((w) => {
      const nw = normalizeArabic(w);
      return nw.startsWith(normalizedInput) && nw !== normalizedInput;
    });
    // Deduplicate and limit
    const unique = [...new Set(matches)].slice(0, 5);
    setSuggestions(unique);
  }, [words, revealedCount]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setFeedback(null);
    updateSuggestions(val);
  };

  const checkWord = (text?: string) => {
    const toCheck = text || inputValue;
    if (!toCheck.trim() || !currentWord) return;

    const normalizedInput = normalizeArabic(toCheck);
    const normalizedExpected = normalizeArabic(currentWord);

    if (normalizedInput === normalizedExpected) {
      setFeedback("correct");
      onCorrectWord?.();
      const newCount = revealedCount + 1;
      setRevealedCount(newCount);
      setInputValue("");
      setSuggestions([]);
      if (newCount >= words.length) {
        setVerseComplete(true);
      } else {
        setTimeout(() => setFeedback(null), 600);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      setFeedback("incorrect");
      setTimeout(() => {
        setFeedback(null);
        setInputValue("");
        inputRef.current?.focus();
      }, 800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkWord();
    }
  };

  const selectSuggestion = (word: string) => {
    setInputValue(word);
    setSuggestions([]);
    setTimeout(() => checkWord(word), 50);
  };

  const skipWord = () => {
    const newCount = revealedCount + 1;
    setRevealedCount(newCount);
    setInputValue("");
    setSuggestions([]);
    setFeedback(null);
    if (newCount >= words.length) {
      setVerseComplete(true);
    }
    inputRef.current?.focus();
  };

  const resetPractice = () => {
    setRevealedCount(0);
    setVerseComplete(false);
    setFeedback(null);
    setInputValue("");
    setSuggestions([]);
    inputRef.current?.focus();
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
              const isCurrent = i === revealedCount;
              return (
                <span
                  key={i}
                  className={`inline-block mx-1 transition-all duration-300 ${
                    i < revealedCount
                      ? "text-foreground"
                      : showVerse
                      ? isCurrent
                        ? "text-primary font-bold border-b-2 border-primary pb-1"
                        : "text-muted-foreground/30"
                      : "text-transparent"
                  }`}
                  style={{ filter: !showVerse && i >= revealedCount ? "blur(0px)" : i > revealedCount ? "blur(2px)" : "none" }}
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
              اكتب الكلمة التالية • كلمة {revealedCount + 1} من {words.length}
            </p>
          </div>
        )}

        {/* Input area */}
        {!verseComplete && (
          <div className="mb-4 relative">
            <div className="flex gap-2 items-center justify-center">
              <input
                ref={inputRef}
                type="text"
                dir="rtl"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب الكلمة هنا..."
                className={`w-full max-w-sm px-4 py-3 rounded-xl border-2 bg-muted/30 font-arabic text-xl text-center outline-none transition-all ${
                  feedback === "correct"
                    ? "border-primary bg-primary/5"
                    : feedback === "incorrect"
                    ? "border-destructive bg-destructive/5"
                    : "border-border focus:border-primary/50"
                }`}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

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
              size="icon"
              onClick={skipWord}
              className="rounded-full border-border hover:bg-primary/10"
              title="تخطي"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          )}

          <Button variant="outline" size="icon" onClick={() => onNext()} className="rounded-full border-border hover:bg-primary/10">
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {!verseComplete && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            اكتب الكلمة ثم اضغط Enter للتحقق
          </p>
        )}
      </div>
    </div>
  );
};

export default TypePracticeMode;
