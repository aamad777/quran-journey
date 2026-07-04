import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, SkipForward, SkipBack, RotateCcw, CheckCircle2, Eye, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Type } from "lucide-react";
import { recordVerseActivity } from "@/lib/gamification";

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
  onCorrectWord?: () => void;
}

// Normalize Arabic text: remove diacritics/tashkeel for comparison
const normalizeArabic = (text: string): string => {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, "")
    .replace(/\u0671/g, "\u0627")
    .replace(/[\u0622\u0623\u0625]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .trim();
};

const splitWords = (text: string): string[] => text.split(/\s+/).filter(Boolean);

const PracticeMode = ({ verses, onNext, onPrev, onCorrectWord }: PracticeModeProps) => {
  const [fontSize, setFontSize] = useState(() => {
    try { return parseInt(localStorage.getItem("quran_font_size") || "36"); } catch { return 36; }
  });
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem("quran_practice_autoadv") !== "false"; } catch { return true; }
  });
  useEffect(() => { try { localStorage.setItem("quran_practice_autoadv", String(autoAdvance)); } catch {} }, [autoAdvance]);

  const [revealedCount, setRevealedCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [verseComplete, setVerseComplete] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepRef = useRef<number>(0);
  const lastSpokenSigRef = useRef<string>("");
  const wrongAttemptsRef = useRef<number>(0);

  // session stats
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [sessionVersesDone, setSessionVersesDone] = useState(0);

  const currentVerse = verses[currentVerseIndex] || verses[0];
  const words = currentVerse ? splitWords(currentVerse.arabic) : [];
  const normalizedWords = words.map(normalizeArabic);

  const playBeep = useCallback((kind: "wrong" | "right" = "wrong") => {
    try {
      const now = Date.now();
      if (now - lastBeepRef.current < 400) return;
      lastBeepRef.current = now;
      if (!audioCtxRef.current) {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current!;
      const t0 = ctx.currentTime;
      if (kind === "wrong") {
        const tones = [
          { f: 360, start: 0, dur: 0.13 },
          { f: 240, start: 0.14, dur: 0.18 },
        ];
        tones.forEach(({ f, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.value = f;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.0001, t0 + start);
          gain.gain.exponentialRampToValueAtTime(0.22, t0 + start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
          osc.start(t0 + start);
          osc.stop(t0 + start + dur + 0.02);
        });
      } else {
        // subtle chime for correct
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
        osc.start(t0);
        osc.stop(t0 + 0.2);
      }
    } catch {}
  }, []);

  useEffect(() => {
    setRevealedCount(0);
    setVerseComplete(false);
    setCurrentVerseIndex(0);
    setSessionCorrect(0);
    setSessionWrong(0);
    setSessionVersesDone(0);
    lastSpokenSigRef.current = "";
    wrongAttemptsRef.current = 0;
  }, [verses]);

  useEffect(() => {
    setRevealedCount(0);
    setVerseComplete(false);
    setHintIndex(null);
    lastSpokenSigRef.current = "";
    wrongAttemptsRef.current = 0;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
      setIsListening(false);
    }
    const t = setTimeout(() => startListeningRef.current?.(), 350);
    return () => clearTimeout(t);
  }, [currentVerseIndex]);

  const startListeningRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (verseComplete) {
      setSessionVersesDone((n) => n + 1);
      recordVerseActivity("practice");
      if (autoAdvance) {
        autoAdvanceTimer.current = setTimeout(() => {
          if (currentVerseIndex < verses.length - 1) {
            setCurrentVerseIndex((i) => i + 1);
          } else {
            onNext();
          }
        }, 1500);
      }
    }
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [verseComplete, currentVerseIndex, verses.length, onNext, autoAdvance]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("متصفحك لا يدعم التعرف على الصوت. جرّب Chrome.");
      return;
    }
    if (recognitionRef.current) return;

    try {
      if (!audioCtxRef.current) {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (Ctx) audioCtxRef.current = new Ctx();
      }
      audioCtxRef.current?.resume?.();
    } catch {}

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 6;

    const lev = (a: string, b: string) => {
      if (a === b) return 0;
      const m = a.length, n = b.length;
      if (!m) return n; if (!n) return m;
      const dp = new Array(n + 1);
      for (let j = 0; j <= n; j++) dp[j] = j;
      for (let i = 1; i <= m; i++) {
        let prev = dp[0];
        dp[0] = i;
        for (let j = 1; j <= n; j++) {
          const tmp = dp[j];
          dp[j] = a[i - 1] === b[j - 1]
            ? prev
            : 1 + Math.min(prev, dp[j], dp[j - 1]);
          prev = tmp;
        }
      }
      return dp[n];
    };

    const isMatch = (spoken: string, expected: string) => {
      if (!spoken || !expected) return false;
      if (spoken === expected) return true;
      if (expected.includes(spoken) || spoken.includes(expected)) return true;
      const tol = Math.max(1, Math.floor(expected.length * 0.25));
      return lev(spoken, expected) <= tol;
    };

    recognition.onresult = (event: any) => {
      const spokenWords: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        spokenWords.push(...splitWords(transcript));
      }
      const normalizedSpoken = spokenWords.map(normalizeArabic).filter(Boolean);
      const sig = normalizedSpoken.join(" ");
      if (sig === lastSpokenSigRef.current) return;
      const prevSig = lastSpokenSigRef.current;
      lastSpokenSigRef.current = sig;

      setRevealedCount((prev) => {
        let matched = prev;
        while (matched < normalizedWords.length) {
          const expected = normalizedWords[matched];
          const found = normalizedSpoken.some((sw) => isMatch(sw, expected));
          if (found) {
            matched++;
            onCorrectWord?.();
            setSessionCorrect((c) => c + 1);
            playBeep("right");
          } else {
            break;
          }
        }

        if (matched === prev && normalizedSpoken.length > 0 && sig !== prevSig) {
          const expected = normalizedWords[matched];
          const latest = normalizedSpoken[normalizedSpoken.length - 1];
          if (expected && latest && !isMatch(latest, expected)) {
            wrongAttemptsRef.current++;
            setSessionWrong((w) => w + 1);
            setWrongFlash(true);
            setTimeout(() => setWrongFlash(false), 400);
            playBeep("wrong");
          }
        }

        if (matched >= normalizedWords.length) {
          setVerseComplete(true);
          try { recognition.stop(); } catch {}
        }

        return matched;
      });
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition && !verseComplete) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
    setIsListening(true);
  }, [normalizedWords, verseComplete, onCorrectWord, playBeep]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  useEffect(() => {
    const t = setTimeout(() => startListeningRef.current?.(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const resetPractice = () => {
    stopListening();
    setRevealedCount(0);
    setVerseComplete(false);
    setHintIndex(null);
  };

  const showHint = () => {
    if (revealedCount >= words.length) return;
    setHintIndex(revealedCount);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintIndex(null), 2500);
  };

  const primaryVerse = verses[0];
  if (!primaryVerse) return null;

  const totalAttempts = sessionCorrect + sessionWrong;
  const accuracy = totalAttempts > 0 ? Math.round((sessionCorrect / totalAttempts) * 100) : 100;

  return (
    <div className="animate-verse-enter w-full max-w-2xl mx-auto">
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

      {/* Session stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-border bg-card/60 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-arabic">
            <TrendingUp className="w-3 h-3" /> دقة
          </div>
          <div className="text-lg font-bold text-primary">{accuracy}٪</div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-arabic">
            <CheckCircle2 className="w-3 h-3" /> صحيح
          </div>
          <div className="text-lg font-bold text-emerald-500">{sessionCorrect.toLocaleString("ar-EG")}</div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-2 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-arabic">
            <Zap className="w-3 h-3" /> آيات
          </div>
          <div className="text-lg font-bold text-foreground">{sessionVersesDone.toLocaleString("ar-EG")}</div>
        </div>
      </div>

      <div className={`bg-card rounded-2xl border border-border p-8 md:p-12 shadow-gold transition-all ${wrongFlash ? "ring-2 ring-destructive animate-pulse" : ""}`}>
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

        <div className="w-full h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${words.length > 0 ? (revealedCount / words.length) * 100 : 0}%` }}
          />
        </div>

        <div className="text-center mb-6 select-none" dir="rtl">
          <p className="font-arabic leading-[2.4]" style={{ fontSize: `${fontSize}px` }}>
            {words.map((word, i) => {
              const done = i < revealedCount;
              const isHint = hintIndex === i;
              return (
                <span
                  key={i}
                  className={`inline-block mx-1 transition-all duration-300 ${
                    done ? "text-emerald-600 dark:text-emerald-400" : isHint ? "text-primary animate-pulse" : "text-muted-foreground/25"
                  }`}
                  style={{
                    filter: done || isHint ? "none" : "blur(2px)",
                  }}
                >
                  {word}
                </span>
              );
            })}
          </p>
        </div>

        {verseComplete && autoAdvance && (
          <p className="text-center text-sm text-muted-foreground mb-4 animate-pulse">
            الانتقال للآية التالية...
          </p>
        )}

        <div className="flex items-center gap-4 my-3">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 rounded-full bg-gold" />
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">حجم الخط</span>
            <Slider
              value={[fontSize]}
              onValueChange={(v) => setFontSize(v[0])}
              min={20}
              max={100}
              step={2}
              className="w-24"
            />
            <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="autoadv" className="text-xs text-muted-foreground cursor-pointer font-arabic">تقدّم تلقائي</Label>
            <Switch id="autoadv" checked={autoAdvance} onCheckedChange={setAutoAdvance} className="scale-90" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button onClick={() => { stopListening(); onPrev(); }} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-border hover:bg-primary/10 transition-all min-w-[52px]">
            <SkipBack className="w-4 h-4" />
            <span className="text-[10px] text-muted-foreground">رجوع</span>
          </button>

          <button onClick={resetPractice} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-border hover:bg-primary/10 transition-all min-w-[52px]">
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px] text-muted-foreground">إعادة</span>
          </button>

          <button
            onClick={showHint}
            disabled={verseComplete || revealedCount >= words.length}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-border hover:bg-primary/10 transition-all min-w-[52px] disabled:opacity-40"
            title="اكشف الكلمة التالية"
          >
            <Eye className="w-4 h-4" />
            <span className="text-[10px] text-muted-foreground">تلميح</span>
          </button>

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={verseComplete}
            className={`flex flex-col items-center gap-0.5 w-14 py-2 rounded-xl transition-all ${
              isListening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "gradient-islamic text-gold hover:opacity-90"
            } disabled:opacity-50`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px]">{isListening ? "إيقاف" : "ميك"}</span>
          </button>

          <button onClick={() => { stopListening(); onNext(); }} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border border-border hover:bg-primary/10 transition-all min-w-[52px]">
            <SkipForward className="w-4 h-4" />
            <span className="text-[10px] text-muted-foreground">التالي</span>
          </button>
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
