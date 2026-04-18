import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, BookmarkCheck, ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface MushafPageProps {
  themeTextColor: string;
  themeMutedText: string;
  themeCardBg: string;
  themeAccentColor: string;
  activeWordColor?: string;
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

const TOTAL_PAGES = 604;
const BOOKMARK_KEY = "quran_bookmarked_pages";
const LAST_PAGE_KEY = "quran_last_mushaf_page";

const getBookmarks = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
  } catch {
    return [];
  }
};

// Convert number to Arabic-Indic digits
const toArabic = (n: number) => n.toLocaleString("ar-EG");

// Surah-specific bismillah handling: surah 1 contains bismillah as first ayah, surah 9 has none
const SURAH_HAS_BISMILLAH_INLINE = 1;
const SURAH_NO_BISMILLAH = 9;

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
  const [bookmarks, setBookmarks] = useState<number[]>(getBookmarks);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [pageInput, setPageInput] = useState<string>(String(page));

  useEffect(() => {
    setPageInput(String(page));
    localStorage.setItem(LAST_PAGE_KEY, String(page));
    let cancelled = false;
    setLoading(true);
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
  }, [page]);

  const isBookmarked = bookmarks.includes(page);

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

  const currentJuz = ayahs[0]?.juz;
  const currentSurahName = ayahs[0]?.surah.name.replace("سُورَةُ ", "");

  // Touch swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 60) {
      // RTL: swipe right → previous page, swipe left → next page
      if (diff > 0) goPage(page - 1);
      else goPage(page + 1);
    }
    setTouchStart(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-3">
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

      {/* Mushaf page — mobile Quran style */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #fdf6e3 0%, #f5ecd0 50%, #ede0b8 100%)`,
          boxShadow: `0 8px 32px ${themeAccentColor}25, inset 0 0 60px rgba(139, 90, 30, 0.08)`,
          border: `1px solid rgba(139, 90, 30, 0.25)`,
        }}
      >
        {/* Top header strip: surah name | juz */}
        <div
          className="flex items-center justify-between px-4 py-2 text-xs font-bold"
          style={{
            background: `linear-gradient(90deg, rgba(139, 90, 30, 0.12), rgba(139, 90, 30, 0.05), rgba(139, 90, 30, 0.12))`,
            borderBottom: `1px solid rgba(139, 90, 30, 0.25)`,
            color: "#5a3a15",
          }}
        >
          <span className="font-arabic">سورة {currentSurahName}</span>
          <span className="font-arabic">الجزء {currentJuz ? toArabic(currentJuz) : ""}</span>
        </div>

        {/* Decorative double border */}
        <div
          className="m-2 p-3 md:p-5 rounded-lg"
          style={{
            border: `2px solid rgba(139, 90, 30, 0.45)`,
            outline: `1px solid rgba(139, 90, 30, 0.25)`,
            outlineOffset: "3px",
          }}
        >
          {loading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-8 w-1/2 mx-auto" style={{ backgroundColor: "rgba(139, 90, 30, 0.1)" }} />
              <Skeleton className="h-6 w-full" style={{ backgroundColor: "rgba(139, 90, 30, 0.1)" }} />
              <Skeleton className="h-6 w-full" style={{ backgroundColor: "rgba(139, 90, 30, 0.1)" }} />
              <Skeleton className="h-6 w-5/6" style={{ backgroundColor: "rgba(139, 90, 30, 0.1)" }} />
              <Skeleton className="h-6 w-full" style={{ backgroundColor: "rgba(139, 90, 30, 0.1)" }} />
              <Skeleton className="h-6 w-4/6" style={{ backgroundColor: "rgba(139, 90, 30, 0.1)" }} />
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
                        className="relative my-3 py-3 px-4 text-center rounded-md"
                        style={{
                          background: `linear-gradient(90deg, rgba(139, 90, 30, 0.1), rgba(212, 175, 55, 0.25), rgba(139, 90, 30, 0.1))`,
                          border: `1.5px solid rgba(139, 90, 30, 0.5)`,
                          boxShadow: `inset 0 0 20px rgba(212, 175, 55, 0.15)`,
                        }}
                      >
                        {/* Decorative corners */}
                        <div className="absolute top-1 right-2 text-xs" style={{ color: "rgba(139, 90, 30, 0.6)" }}>﴾</div>
                        <div className="absolute top-1 left-2 text-xs" style={{ color: "rgba(139, 90, 30, 0.6)" }}>﴿</div>
                        <h3 className="font-arabic text-xl md:text-2xl font-bold tracking-wide" style={{ color: "#5a3a15" }}>
                          سورة {g.surah.name.replace("سُورَةُ ", "")}
                        </h3>
                        <div className="text-[10px] mt-0.5" style={{ color: "rgba(90, 58, 21, 0.7)" }}>
                          عدد آياتها {/* aya count not in API; omit */}
                        </div>
                      </div>
                    )}
                    {showBismillah && (
                      <div className="text-center my-3">
                        <p
                          className="font-arabic text-2xl md:text-3xl font-bold"
                          style={{ color: "#3a2510" }}
                        >
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </p>
                      </div>
                    )}
                    <p
                      className="font-arabic text-justify"
                      style={{
                        color: "#1a1208",
                        fontSize: "clamp(20px, 4.5vw, 26px)",
                        lineHeight: "2.4",
                        textAlignLast: "center",
                        wordSpacing: "0.05em",
                      }}
                    >
                      {g.ayahs.map((a) => (
                        <span key={a.number}>
                          {a.text}
                          <span
                            className="inline-flex items-center justify-center mx-0.5 align-middle"
                            style={{
                              width: "1.6em",
                              height: "1.6em",
                              fontSize: "0.55em",
                              fontWeight: 700,
                              color: "#5a3a15",
                              background:
                                "radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.15) 70%, transparent 100%)",
                              border: "1.5px solid rgba(139, 90, 30, 0.55)",
                              borderRadius: "50%",
                              fontFamily: "'Amiri', serif",
                            }}
                          >
                            {toArabic(a.numberInSurah)}
                          </span>
                          {" "}
                        </span>
                      ))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer strip */}
        <div
          className="flex items-center justify-center px-4 py-2"
          style={{
            background: `linear-gradient(90deg, rgba(139, 90, 30, 0.05), rgba(139, 90, 30, 0.15), rgba(139, 90, 30, 0.05))`,
            borderTop: `1px solid rgba(139, 90, 30, 0.25)`,
          }}
        >
          <span
            className="inline-flex items-center justify-center font-arabic font-bold"
            style={{
              minWidth: "2.5rem",
              height: "2.5rem",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212, 175, 55, 0.3), rgba(139, 90, 30, 0.12))",
              border: "1.5px solid rgba(139, 90, 30, 0.5)",
              color: "#5a3a15",
              fontSize: "0.95rem",
            }}
          >
            {toArabic(page)}
          </span>
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-[11px]" style={{ color: themeMutedText }}>
        اسحب يميناً أو يساراً للتنقل بين الصفحات
      </p>
    </div>
  );
};

export default MushafPage;
