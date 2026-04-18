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

const MushafPage = ({
  themeTextColor,
  themeMutedText,
  themeCardBg,
  themeAccentColor,
  activeWordColor,
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
    const next = isBookmarked ? bookmarks.filter((p) => p !== page) : [...bookmarks, page].sort((a, b) => a - b);
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
    const groups: { surah: Ayah["surah"]; ayahs: Ayah[] }[] = [];
    ayahs.forEach((a) => {
      const last = groups[groups.length - 1];
      if (last && last.surah.number === a.surah.number) {
        last.ayahs.push(a);
      } else {
        groups.push({ surah: a.surah, ayahs: [a] });
      }
    });
    return groups;
  }, [ayahs]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Toolbar */}
      <div
        className="rounded-xl backdrop-blur-md p-3 flex items-center justify-between gap-2 flex-wrap"
        style={{ backgroundColor: themeCardBg, border: `1px solid ${themeMutedText}20` }}
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => goPage(page - 1)}
            disabled={page <= 1}
            style={{ color: themeTextColor }}
          >
            <ChevronRight className="w-4 h-4" />
            السابقة
          </Button>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: themeMutedText }}>
            <span>صفحة</span>
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
              className="w-14 text-center rounded-md py-1 text-sm font-bold outline-none"
              style={{
                backgroundColor: `${themeAccentColor}15`,
                color: themeTextColor,
                border: `1px solid ${themeAccentColor}30`,
              }}
            />
            <span>من {TOTAL_PAGES}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => goPage(page + 1)}
            disabled={page >= TOTAL_PAGES}
            style={{ color: themeTextColor }}
          >
            التالية
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowBookmarks((s) => !s)}
            className="gap-1.5 text-xs"
            style={{ color: themeMutedText }}
          >
            <BookOpen className="w-4 h-4" />
            العلامات ({bookmarks.length})
          </Button>
          <Button
            size="sm"
            onClick={toggleBookmark}
            className="gap-1.5 text-xs"
            style={{
              backgroundColor: isBookmarked ? themeAccentColor : `${themeAccentColor}20`,
              color: isBookmarked ? "#fff" : themeAccentColor,
            }}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {isBookmarked ? "محفوظة" : "احفظ"}
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
                  صفحة {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Page content */}
      <div
        className="rounded-2xl backdrop-blur-md p-6 md:p-10"
        style={{
          backgroundColor: themeCardBg,
          border: `1px solid ${themeMutedText}20`,
          boxShadow: `0 4px 24px ${themeAccentColor}10`,
        }}
      >
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/3 mx-auto" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/6" />
          </div>
        ) : (
          <div dir="rtl" className="space-y-6">
            {grouped.map((g, gi) => (
              <div key={`${g.surah.number}-${gi}`}>
                {(g.ayahs[0].numberInSurah === 1 || gi === 0) && (
                  <div
                    className="text-center py-3 mb-4 rounded-xl"
                    style={{
                      background: `linear-gradient(90deg, ${themeAccentColor}10, ${themeAccentColor}25, ${themeAccentColor}10)`,
                      border: `1px solid ${themeAccentColor}30`,
                    }}
                  >
                    <h3 className="font-arabic text-2xl font-bold" style={{ color: themeTextColor }}>
                      سورة {g.surah.name.replace("سُورَةُ ", "")}
                    </h3>
                  </div>
                )}
                <p
                  className="font-arabic text-2xl md:text-3xl leading-[2.6] text-justify"
                  style={{ color: themeTextColor }}
                >
                  {g.ayahs.map((a) => (
                    <span key={a.number}>
                      {a.text}
                      <span
                        className="inline-flex items-center justify-center mx-1 w-8 h-8 rounded-full text-xs font-bold align-middle"
                        style={{
                          backgroundColor: `${themeAccentColor}20`,
                          color: themeAccentColor,
                          border: `1px solid ${themeAccentColor}40`,
                        }}
                      >
                        {a.numberInSurah.toLocaleString("ar-EG")}
                      </span>{" "}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Footer page number */}
        <div className="text-center mt-8 pt-4 border-t" style={{ borderColor: `${themeMutedText}20` }}>
          <span
            className="inline-block px-4 py-1 rounded-full text-sm font-bold"
            style={{ backgroundColor: `${themeAccentColor}15`, color: themeAccentColor }}
          >
            {page.toLocaleString("ar-EG")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MushafPage;
