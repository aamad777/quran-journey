import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, SkipForward, SkipBack, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Type } from "lucide-react";

interface VerseData {
  arabic: string;
  tajweedText: string;
  surahName: string;
  surahNameArabic: string;
  surahNumber: number;
  ayahNumber: number;
}

interface PracticeModeProps {
  verses: VerseData[];
  onNext: () => void;
  onPrev: () => void;
}

// Normalize Arabic text: remove diacritics/tashkeel for comparison
const normalizeArabic = (text: string): string => {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, "")
    .replace(/\u0671/g, "\u0627") // alef wasla -> alef
    .replace(/[\u0622\u0623\u0625]/g, "\u0627") // normalize alef variants
    .replace(/\u0649/g, "\u064A") // alef maqsura -> ya
    .replace(/\u0629/g, "\u0647") // ta marbuta -> ha
    .trim();
};

const splitWords = (text: string): string[] => {
  return text.split(/\s+/).filter(Boolean);
};

const PracticeMode = ({ verses, onNext, onPrev }: PracticeModeProps) => {
  const [fontSize, setFontSize] = useState(() => {
    try { return parseInt(localStorage.getItem("quran_font_size") || "36"); } catch { return 36; }
  });
  const [revealedCount, setRevealedCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [verseComplete, setVerseComplete] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentVerse = verses[currentVerseIndex] || verses[0];
  const words = currentVerse ? splitWords(currentVerse.arabic) : [];
  const normalizedWords = words.map(normalizeArabic);

  // Reset state when verse changes
  useEffect(() => {
    setRevealedCount(0);
    setVerseComplete(false);
    setCurrentVerseIndex(0);
  }, [verses]);

  useEffect(() => {
    setRevealedCount(0);
    setVerseComplete(false);
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

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("متصفحك لا يدعم التعرف على الصوت. جرّب Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

    recognition.onresult = (event: any) => {
      // Gather all spoken words from results
      const spokenWords: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        for (let alt = 0; alt < event.results[i].length; alt++) {
          const transcript = event.results[i][alt].transcript;
          spokenWords.push(...splitWords(transcript));
        }
      }

      const normalizedSpoken = spokenWords.map(normalizeArabic);

      // Check how many consecutive words from start match
      setRevealedCount((prev) => {
        let matched = prev;
        // Try to match the next expected word(s)
        while (matched < normalizedWords.length) {
          const expected = normalizedWords[matched];
          const found = normalizedSpoken.some((sw) => {
            // Fuzzy: check if spoken word contains or equals expected
            return sw === expected || expected.includes(sw) || sw.includes(expected);
          });
          if (found) {
            matched++;
          } else {
            break;
          }
        }

        if (matched >= normalizedWords.length) {
          setVerseComplete(true);
          recognition.stop();
          setIsListening(false);
        }

        return matched;
      });
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      // Restart if still listening and not complete
      if (recognitionRef.current && !verseComplete) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [normalizedWords, verseComplete]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const resetPractice = () => {
    stopListening();
    setRevealedCount(0);
    setVerseComplete(false);
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
      <div className="bg-card rounded-2xl border border-border p-8 md:p-12 shadow-gold">
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

        {/* Words display */}
        <div className="text-center mb-6 select-none" dir="rtl">
          <p className="font-arabic leading-[2.4]" style={{ fontSize: `${fontSize}px` }}>
            {words.map((word, i) => (
              <span
                key={i}
                className={`inline-block mx-1 transition-all duration-300 ${
                  i < revealedCount
                    ? "text-foreground"
                    : "text-muted-foreground/20"
                }`}
                style={{
                  filter: i < revealedCount ? "none" : "blur(2px)",
                }}
              >
                {word}
              </span>
            ))}
          </p>
        </div>

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

        {/* Font size */}
        <div className="flex items-center justify-center gap-2 mb-6">
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

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={() => { stopListening(); onPrev(); }} className="rounded-full border-border hover:bg-primary/10">
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={resetPractice} className="rounded-full border-border hover:bg-primary/10">
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            onClick={isListening ? stopListening : startListening}
            size="icon"
            disabled={verseComplete}
            className={`w-14 h-14 rounded-full transition-all ${
              isListening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "gradient-islamic text-gold hover:opacity-90"
            }`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button variant="outline" size="icon" onClick={() => { stopListening(); onNext(); }} className="rounded-full border-border hover:bg-primary/10">
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {!isListening && !verseComplete && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            اضغط على المايك وابدأ بالقراءة
          </p>
        )}
        {isListening && (
          <p className="text-center text-xs text-muted-foreground mt-4 animate-pulse">
            جارٍ الاستماع...
          </p>
        )}
      </div>
    </div>
  );
};

export default PracticeMode;
