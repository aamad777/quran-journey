import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  ListOrdered,
  Mic2,
} from "lucide-react";
import { toast } from "sonner";
import {
  TOTAL_PAGES,
  TOTAL_JUZ,
  getJuzForPage,
  getJuzPageRange,
} from "@/lib/juzPages";
import { colorizeUthmani } from "@/lib/simpleTajweed";
import { RECITERS, getReciterById, resolveAyahAudioUrl } from "@/lib/reciters";

interface MushafPageProps {
  themeTextColor: string;
  themeMutedText: string;
  themeCardBg: string;
  themeAccentColor: string;
  initialPage?: number;
}

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  surah: { number: number; name: string; englishName: string };
  page: number;
  juz: number;
  hizbQuarter: number;
}

const BOOKMARK_KEY = "quran_bookmarked_pages";
const LAST_PAGE_KEY = "quran_last_mushaf_page";
const COMPLETED_PAGES_KEY = "quran_completed_pages";
const HEADER_STYLE_KEY = "quran_mushaf_header_style";

export type HeaderStyle = "classic" | "ornate" | "minimal";

const getStoredArr = (key: string): number[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const toArabic = (n: number) => n.toLocaleString("ar-EG");

const SURAH_HAS_BISMILLAH_INLINE = 1;
const SURAH_NO_BISMILLAH = 9;

const RECITER_KEY = "quran_mushaf_reciter";

const MushafPage = ({
  themeTextColor,
  themeMutedText,
  themeCardBg,
  themeAccentColor,
  initialPage,
}: MushafPageProps) => {
  const [page, setPage] = useState<number>(() => {
    if (initialPage) return initialPage;
    try {
      return parseInt(localStorage.getItem(LAST_PAGE_KEY) || "1");
    } catch {
      return 1;
    }
  });
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<number[]>(() => getStoredArr(BOOKMARK_KEY));
  const [completed, setCompleted] = useState<number[]>(() => getStoredArr(COMPLETED_PAGES_KEY));
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showJuzList, setShowJuzList] = useState(false);
  const [pageInput, setPageInput] = useState<string>(String(page));

  // Audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const [playingIdx, setPlayingIdx] = useState<number>(-1); // index in ayahs[]
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1); // word index inside playing ayah
  const [reciterId, setReciterId] = useState<string>(() => {
    try {
      return localStorage.getItem(RECITER_KEY) || "ar.alafasy";
    } catch {
      return "ar.alafasy";
    }
  });
  const reciter = getReciterById(reciterId);

  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>(() => {
    try {
      return (localStorage.getItem(HEADER_STYLE_KEY) as HeaderStyle) || "classic";
    } catch {
      return "classic";
    }
  });

  const changeReciter = (id: string) => {
    setReciterId(id);
    try { localStorage.setItem(RECITER_KEY, id); } catch {}
    stopAudio();
  };

  const changeHeaderStyle = (style: HeaderStyle) => {
    setHeaderStyle(style);
    try { localStorage.setItem(HEADER_STYLE_KEY, style); } catch {}
  };

  useEffect(() => {
    setPageInput(String(page));
    localStorage.setItem(LAST_PAGE_KEY, String(page));
    let cancelled = false;
    setLoading(true);
    // stop audio on page change
    stopAudio();
    fetch(`https://api.alquran.cloud/v1/page/${page}/quran-uthmani`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setAyahs(d?.data?.ayahs || []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const isBookmarked = bookmarks.includes(page);
  const isCompleted = completed.includes(page);

  const toggleBookmark = () => {
    const next = isBookmarked
      ? bookmarks.filter((p) => p !== page)
      : [...bookmarks, page].sort((a, b) => a - b);
    setBookmarks(next);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    toast.success(isBookmarked ? `تمت إزالة العلامة من صفحة ${page}` : `تم حفظ صفحة ${page}`);
  };

  const goPage = (n: number) => {
    if (n < 1 || n > TOTAL_PAGES) return;
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------- Juz progress ----------
  const currentJuz = getJuzForPage(page);
  const juzRange = getJuzPageRange(currentJuz);
  const juzTotalPages = juzRange.end - juzRange.start + 1;
  const juzCompletedPages = useMemo(
    () => completed.filter((p) => p >= juzRange.start && p <= juzRange.end).length,
    [completed, juzRange.start, juzRange.end]
  );
  const juzRemaining = juzTotalPages - juzCompletedPages;
  const juzProgress = (juzCompletedPages / juzTotalPages) * 100;

  const markPageComplete = () => {
    if (isCompleted) {
      const next = completed.filter((p) => p !== page);
      setCompleted(next);
      localStorage.setItem(COMPLETED_PAGES_KEY, JSON.stringify(next));
      toast(`تم إلغاء إكمال صفحة ${toArabic(page)}`);
      return;
    }
    const next = [...completed, page].sort((a, b) => a - b);
    setCompleted(next);
    localStorage.setItem(COMPLETED_PAGES_KEY, JSON.stringify(next));

    // Recompute juz progress with new state
    const newJuzDone = next.filter((p) => p >= juzRange.start && p <= juzRange.end).length;
    const remaining = juzTotalPages - newJuzDone;

    if (remaining === 0) {
      toast.success(`🎉 أكملت الجزء ${toArabic(currentJuz)}!`, {
        description:
          currentJuz < TOTAL_JUZ
            ? `ننتقل إلى الجزء ${toArabic(currentJuz + 1)}`
            : "أكملت القرآن كاملاً، تقبل الله منك",
      });
      if (currentJuz < TOTAL_JUZ) {
        const nextJuzStart = getJuzPageRange(currentJuz + 1).start;
        setTimeout(() => goPage(nextJuzStart), 800);
      }
    } else {
      toast.success(`أحسنت! تبقى ${toArabic(remaining)} صفحة في الجزء ${toArabic(currentJuz)}`);
      // auto-advance to next page if not last
      if (page < TOTAL_PAGES) setTimeout(() => goPage(page + 1), 600);
    }
  };

  // ---------- Audio ----------
  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopAudio = () => {
    clearTimer();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setPlayingIdx(-1);
    setActiveWordIdx(-1);
    setIsPlaying(false);
  };

  const playReqId = useRef(0);

  const playFromIndex = async (idx: number) => {
    if (idx < 0 || idx >= ayahs.length) {
      stopAudio();
      return;
    }
    const a = ayahs[idx];
    const reqId = ++playReqId.current;
    setPlayingIdx(idx);
    setActiveWordIdx(-1);
    const url = await resolveAyahAudioUrl(reciter, a.surah.number, a.numberInSurah);
    if (reqId !== playReqId.current) return;
    if (!url) {
      playFromIndex(idx + 1);
      return;
    }
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.src = url;

    // Word-by-word highlighting via char-proportion timing
    // (works for any reciter without needing per-word timestamps)
    const words = a.text.split(/\s+/).filter(Boolean);
    const lengths = words.map((w) => Math.max(1, Array.from(w).length));
    const totalChars = lengths.reduce((s, n) => s + n, 0);
    const cumulative: number[] = [];
    let acc = 0;
    for (const l of lengths) {
      acc += l;
      cumulative.push(acc);
    }

    const tick = () => {
      if (!audioRef.current || reqId !== playReqId.current) return;
      const dur = audioRef.current.duration;
      const cur = audioRef.current.currentTime;
      if (!isFinite(dur) || dur <= 0) return;
      const ratio = cur / dur;
      const target = ratio * totalChars;
      let wi = cumulative.findIndex((c) => target <= c);
      if (wi < 0) wi = words.length - 1;
      setActiveWordIdx(wi);
    };

    audio.onended = () => {
      clearTimer();
      if (reqId === playReqId.current) playFromIndex(idx + 1);
    };
    audio.onpause = () => {
      setIsPlaying(false);
    };
    audio.onplay = () => {
      setIsPlaying(true);
      clearTimer();
      timerRef.current = window.setInterval(tick, 80);
    };
    audio.onerror = () => {
      clearTimer();
      if (reqId === playReqId.current) playFromIndex(idx + 1);
    };
    audio.play().catch(() => {});
  };


  const togglePagePlay = () => {
    if (playingIdx >= 0 && audioRef.current && audioRef.current.src) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
      return;
    }
    playFromIndex(0);
  };

  useEffect(() => () => stopAudio(), []);

  const grouped = useMemo(() => {
    const groups: { surah: Ayah["surah"]; ayahs: Ayah[]; startsAtAyah1: boolean }[] = [];
    ayahs.forEach((a) => {
      const last = groups[groups.length - 1];
      if (last && last.surah.number === a.surah.number) {
        last.ayahs.push(a);
      } else {
        groups.push({ surah: a.surah, ayahs: [a], startsAtAyah1: a.numberInSurah === 1 });
      }
    });
    return groups;
  }, [ayahs]);

  const currentSurahName = ayahs[0]?.surah.name.replace("سُورَةُ ", "");

  // Touch swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goPage(page - 1);
      else goPage(page + 1);
    }
    setTouchStart(null);
  };

  // Map ayah.number → playing flag for highlighting
  const playingAyahNumber = playingIdx >= 0 ? ayahs[playingIdx]?.number : -1;

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* Juz progress card */}
      <div
        className="rounded-xl backdrop-blur-md p-3 space-y-2"
        style={{ backgroundColor: themeCardBg, border: `1px solid ${themeMutedText}20` }}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowJuzList((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-bold"
            style={{ color: themeTextColor }}
          >
            <ListOrdered className="w-4 h-4" />
            <span>الجزء {toArabic(currentJuz)} / {toArabic(TOTAL_JUZ)}</span>
          </button>
          <span className="text-xs" style={{ color: themeMutedText }}>
            {juzRemaining === 0 ? (
              <span style={{ color: themeAccentColor, fontWeight: 700 }}>مكتمل ✓</span>
            ) : (
              <>متبقّي <b style={{ color: themeTextColor }}>{toArabic(juzRemaining)}</b> من {toArabic(juzTotalPages)} صفحة</>
            )}
          </span>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: `${themeAccentColor}20` }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${juzProgress}%`,
              background: `linear-gradient(90deg, ${themeAccentColor}, ${themeAccentColor}cc)`,
            }}
          />
        </div>
        {showJuzList && (
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 pt-2">
            {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((j) => {
              const r = getJuzPageRange(j);
              const done = completed.filter((p) => p >= r.start && p <= r.end).length;
              const total = r.end - r.start + 1;
              const isCurrent = j === currentJuz;
              const isDone = done === total;
              return (
                <button
                  key={j}
                  onClick={() => {
                    goPage(r.start);
                    setShowJuzList(false);
                  }}
                  className="rounded-md py-1.5 text-xs font-bold transition-transform hover:scale-105"
                  style={{
                    backgroundColor: isCurrent
                      ? themeAccentColor
                      : isDone
                      ? `${themeAccentColor}40`
                      : `${themeAccentColor}15`,
                    color: isCurrent ? "#fff" : themeAccentColor,
                    border: isDone ? `1px solid ${themeAccentColor}80` : "1px solid transparent",
                  }}
                  title={`صفحات ${r.start}-${r.end} (${done}/${total})`}
                >
                  {toArabic(j)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Compact toolbar */}
      <div
        className="rounded-xl backdrop-blur-md p-2 flex items-center justify-between gap-2 flex-wrap"
        style={{ backgroundColor: themeCardBg, border: `1px solid ${themeMutedText}20` }}
      >
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => goPage(page - 1)}
            disabled={page <= 1}
            className="h-8 px-2"
            style={{ color: themeTextColor }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: themeMutedText }}>
            <input
              type="number"
              min={1}
              max={TOTAL_PAGES}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => {
                const n = parseInt(pageInput);
                if (!isNaN(n)) goPage(Math.min(TOTAL_PAGES, Math.max(1, n)));
                else setPageInput(String(page));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="w-12 text-center rounded-md py-1 text-sm font-bold outline-none"
              style={{
                backgroundColor: `${themeAccentColor}15`,
                color: themeTextColor,
                border: `1px solid ${themeAccentColor}30`,
              }}
            />
            <span>/ {TOTAL_PAGES}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => goPage(page + 1)}
            disabled={page >= TOTAL_PAGES}
            className="h-8 px-2"
            style={{ color: themeTextColor }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5" title="القارئ">
            <Mic2 className="w-3.5 h-3.5" style={{ color: themeAccentColor }} />
            <select
              value={reciterId}
              onChange={(e) => changeReciter(e.target.value)}
              className="h-8 max-w-[150px] sm:max-w-[200px] rounded-md text-xs font-bold outline-none px-2 truncate font-arabic"
              style={{
                background: `linear-gradient(135deg, ${themeAccentColor}25, ${themeAccentColor}10)`,
                color: themeAccentColor,
                border: `1.5px solid ${themeAccentColor}60`,
                direction: "rtl",
                textShadow: `0 0 1px ${themeAccentColor}40`,
              }}
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id} style={{ color: "#000", fontWeight: 700 }}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePagePlay}
            className="gap-1.5 text-xs h-8 px-2"
            style={{ color: isPlaying ? themeAccentColor : themeMutedText }}
            title="تشغيل الصفحة"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowBookmarks((s) => !s)}
            className="gap-1.5 text-xs h-8 px-2"
            style={{ color: themeMutedText }}
          >
            <BookOpen className="w-4 h-4" />
            {bookmarks.length > 0 && <span>{bookmarks.length}</span>}
          </Button>
          <Button
            size="sm"
            onClick={toggleBookmark}
            className="gap-1.5 text-xs h-8 px-3"
            style={{
              backgroundColor: isBookmarked ? themeAccentColor : `${themeAccentColor}20`,
              color: isBookmarked ? "#fff" : themeAccentColor,
            }}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Bookmarks list */}
      {showBookmarks && (
        <div
          className="rounded-xl backdrop-blur-md p-3"
          style={{ backgroundColor: themeCardBg, border: `1px solid ${themeMutedText}20` }}
        >
          {bookmarks.length === 0 ? (
            <p className="text-sm text-center py-2" style={{ color: themeMutedText }}>
              لا توجد علامات محفوظة بعد
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bookmarks.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    goPage(p);
                    setShowBookmarks(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold transition-transform hover:scale-105"
                  style={{
                    backgroundColor: p === page ? themeAccentColor : `${themeAccentColor}20`,
                    color: p === page ? "#fff" : themeAccentColor,
                  }}
                >
                  صفحة {toArabic(p)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mushaf page — authentic Madani-style parchment */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative rounded-sm overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(255, 252, 240, 0.95), transparent 70%),
            radial-gradient(ellipse at 50% 100%, rgba(232, 210, 165, 0.55), transparent 70%),
            linear-gradient(180deg, #f7efd8 0%, #f1e6c2 50%, #e9dab0 100%)
          `,
          backgroundColor: "#f4ead0",
          boxShadow: `
            0 18px 50px rgba(80, 50, 10, 0.28),
            inset 0 0 100px rgba(140, 95, 30, 0.10),
            inset 0 0 0 1px rgba(120, 75, 20, 0.15)
          `,
          border: `1px solid rgba(120, 75, 20, 0.45)`,
        }}
      >
        {/* Subtle paper grain */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.30  0 0 0 0 0.10  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />

        {/* Top header strip */}
        <div
          className="relative flex items-center justify-between px-5 py-2.5 text-xs font-bold font-arabic"
          style={{
            background: `linear-gradient(90deg, rgba(90, 58, 21, 0.20) 0%, rgba(212, 175, 55, 0.35) 50%, rgba(90, 58, 21, 0.20) 100%)`,
            borderBottom: `3px double rgba(90, 58, 21, 0.55)`,
            color: "#3d2810",
            textShadow: "0 1px 0 rgba(255, 245, 210, 0.6)",
          }}
        >
          <span>سورة {currentSurahName}</span>
          <span className="tracking-widest opacity-80">۞</span>
          <span>الجزء {toArabic(currentJuz)}</span>
        </div>

        {/* Decorative double border */}
        <div
          className="relative m-3 p-4 md:p-6 rounded-sm"
          style={{
            border: `2.5px solid rgba(90, 58, 21, 0.7)`,
            outline: `1px solid rgba(90, 58, 21, 0.4)`,
            outlineOffset: "4px",
            boxShadow: "inset 0 0 30px rgba(140, 95, 30, 0.08)",
          }}
        >
          {loading ? (
            <div className="space-y-3 py-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-6 w-full"
                  style={{ backgroundColor: "rgba(120, 75, 20, 0.1)" }}
                />
              ))}
            </div>
          ) : (
            <div dir="rtl" className="space-y-4">
              {grouped.map((g, gi) => {
                const showSurahHeader = g.startsAtAyah1;
                const showBismillah =
                  g.startsAtAyah1 &&
                  g.surah.number !== SURAH_HAS_BISMILLAH_INLINE &&
                  g.surah.number !== SURAH_NO_BISMILLAH;
                return (
                  <div key={`${g.surah.number}-${gi}`}>
                    {showSurahHeader && (
                      <div
                        className="relative my-4 py-4 px-6 text-center"
                        style={{
                          background: `linear-gradient(180deg, rgba(212, 175, 55, 0.32) 0%, rgba(180, 130, 50, 0.22) 100%)`,
                          border: `2px solid rgba(90, 58, 21, 0.7)`,
                          outline: `1px solid rgba(90, 58, 21, 0.45)`,
                          outlineOffset: "3px",
                          boxShadow: `inset 0 0 28px rgba(212, 175, 55, 0.35), 0 2px 8px rgba(90, 58, 21, 0.15)`,
                          borderRadius: "2px",
                        }}
                      >
                        <div className="absolute -top-1 right-3 text-base font-bold" style={{ color: "rgba(90, 58, 21, 0.85)" }}>﴾</div>
                        <div className="absolute -top-1 left-3 text-base font-bold" style={{ color: "rgba(90, 58, 21, 0.85)" }}>﴿</div>
                        <h3 className="font-arabic text-2xl md:text-3xl font-bold tracking-wide" style={{ color: "#3d2810", textShadow: "0 1px 0 rgba(255, 245, 210, 0.5)" }}>
                          سورة {g.surah.name.replace("سُورَةُ ", "")}
                        </h3>
                        <div className="mt-1 text-[10px] font-arabic tracking-[0.3em]" style={{ color: "rgba(90, 58, 21, 0.7)" }}>
                          ◆ ◆ ◆
                        </div>
                      </div>
                    )}
                    {showBismillah && (
                      <div className="text-center my-4">
                        <p
                          className="font-arabic text-2xl md:text-3xl font-bold"
                          style={{ color: "#1a1208", letterSpacing: "0.02em" }}
                        >
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </p>
                      </div>
                    )}
                    <p
                      className="font-arabic text-justify relative"
                      style={{
                        color: "#0f0a04",
                        fontSize: "clamp(21px, 4.6vw, 28px)",
                        lineHeight: "2.5",
                        textAlignLast: "center",
                        wordSpacing: "0.06em",
                        fontWeight: 500,
                        textShadow: "0 0.5px 0 rgba(255, 245, 210, 0.4)",
                      }}
                    >
                      {g.ayahs.map((a) => {
                        const ayahIdx = ayahs.findIndex((x) => x.number === a.number);
                        const isActiveAyah = a.number === playingAyahNumber;
                        const words = a.text.split(/\s+/).filter(Boolean);
                        return (
                          <span
                            key={a.number}
                            onClick={() => playFromIndex(ayahIdx)}
                            style={{
                              cursor: "pointer",
                              backgroundColor: isActiveAyah
                                ? "rgba(212, 175, 55, 0.18)"
                                : "transparent",
                              borderRadius: "4px",
                              padding: isActiveAyah ? "2px 3px" : "0",
                              transition: "background-color 0.3s",
                            }}
                          >
                            {words.map((w, wi) => {
                              const isActiveWord = isActiveAyah && wi === activeWordIdx;
                              const segs = colorizeUthmani(w);
                              return (
                                <span
                                  key={wi}
                                  style={{
                                    display: "inline-block",
                                    padding: isActiveWord ? "1px 4px" : "0",
                                    margin: isActiveWord ? "0 1px" : "0",
                                    borderRadius: "5px",
                                    backgroundColor: isActiveWord
                                      ? "rgba(212, 175, 55, 0.55)"
                                      : "transparent",
                                    boxShadow: isActiveWord
                                      ? "0 0 14px rgba(212, 175, 55, 0.7)"
                                      : "none",
                                    transform: isActiveWord ? "scale(1.06)" : "scale(1)",
                                    transition: "all 0.18s ease-out",
                                  }}
                                >
                                  {segs.map((s, si) => (
                                    <span key={si} style={s.color ? { color: s.color } : undefined}>
                                      {s.text}
                                    </span>
                                  ))}
                                </span>
                              );
                            }).reduce<React.ReactNode[]>((acc, el, i) => {
                              if (i > 0) acc.push(" ");
                              acc.push(el);
                              return acc;
                            }, [])}
                            <span
                              className="inline-flex items-center justify-center mx-0.5 align-middle"
                              style={{
                                width: "1.7em",
                                height: "1.7em",
                                fontSize: "0.55em",
                                fontWeight: 700,
                                color: "#3d2810",
                                background:
                                  "radial-gradient(circle at 35% 30%, #f4d57a 0%, #d4a738 55%, #8b5a1a 100%)",
                                border: "1px solid rgba(60, 35, 8, 0.85)",
                                boxShadow:
                                  "inset 0 0 4px rgba(255, 240, 190, 0.7), inset 0 0 0 1px rgba(255, 240, 190, 0.4), 0 1px 2px rgba(60, 35, 8, 0.3)",
                                borderRadius: "50%",
                                fontFamily: "'Amiri', serif",
                                textShadow: "0 1px 0 rgba(255, 245, 210, 0.5)",
                              }}
                            >
                              {toArabic(a.numberInSurah)}
                            </span>
                            {" "}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer strip */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            background: `linear-gradient(90deg, rgba(120, 75, 20, 0.08), rgba(120, 75, 20, 0.18), rgba(120, 75, 20, 0.08))`,
            borderTop: `2px double rgba(120, 75, 20, 0.4)`,
          }}
        >
          <span className="text-[10px] font-arabic" style={{ color: "rgba(90, 58, 21, 0.7)" }}>
            مدّ • <span style={{ color: "#1d4ed8" }}>أزرق</span> &nbsp; غنّة • <span style={{ color: "#1f7a3a" }}>أخضر</span>
          </span>
          <span
            className="inline-flex items-center justify-center font-arabic font-bold"
            style={{
              minWidth: "2.6rem",
              height: "2.6rem",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #f4d57a 0%, #d4a738 55%, #8b5a1a 100%)",
              border: "1.5px solid rgba(60, 35, 8, 0.85)",
              boxShadow: "inset 0 0 6px rgba(255, 240, 190, 0.7), 0 2px 4px rgba(60, 35, 8, 0.25)",
              color: "#3d2810",
              fontSize: "1rem",
              textShadow: "0 1px 0 rgba(255, 245, 210, 0.6)",
            }}
          >
            {toArabic(page)}
          </span>
          <span className="text-[10px]" style={{ color: "rgba(90, 58, 21, 0.7)" }}>
            {toArabic(juzCompletedPages)}/{toArabic(juzTotalPages)}
          </span>
        </div>
      </div>

      {/* Mark complete button */}
      <Button
        onClick={markPageComplete}
        className="w-full gap-2 h-12 text-sm font-bold"
        style={{
          backgroundColor: isCompleted ? `${themeAccentColor}30` : themeAccentColor,
          color: isCompleted ? themeAccentColor : "#fff",
          border: `1px solid ${themeAccentColor}`,
        }}
      >
        {isCompleted ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            تم إكمال هذه الصفحة (انقر للإلغاء)
          </>
        ) : (
          <>
            <Circle className="w-5 h-5" />
            أكملت هذه الصفحة
          </>
        )}
      </Button>

      {/* Hint */}
      <p className="text-center text-[11px]" style={{ color: themeMutedText }}>
        اسحب يميناً أو يساراً للتنقل • انقر على آية لتشغيلها
      </p>
    </div>
  );
};

export default MushafPage;
