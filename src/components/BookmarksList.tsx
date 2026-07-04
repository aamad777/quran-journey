import { Heart, Trash2, BookOpen } from "lucide-react";
import { useBookmarks, removeBookmark } from "@/lib/bookmarks";

interface Props {
  onSelectVerse: (surah: number, ayah: number) => void;
  themeTextColor?: string;
  themeMutedText?: string;
  themeCardBg?: string;
  themeAccentColor?: string;
}

export default function BookmarksList({ onSelectVerse, themeTextColor, themeMutedText, themeCardBg, themeAccentColor }: Props) {
  const list = useBookmarks();
  if (list.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20" dir="rtl">
        <Heart className="w-12 h-12 mx-auto mb-4 opacity-40" style={{ color: themeAccentColor }} />
        <h2 className="font-arabic text-xl font-bold mb-2" style={{ color: themeTextColor }}>لا توجد آيات محفوظة</h2>
        <p className="font-arabic text-sm" style={{ color: themeMutedText }}>
          اضغط على أيقونة القلب بجانب أي آية لحفظها هنا.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-arabic text-lg font-bold" style={{ color: themeTextColor }}>
          <Heart className="w-4 h-4 inline-block ml-2 fill-current" style={{ color: themeAccentColor }} />
          الآيات المحفوظة ({list.length.toLocaleString("ar-EG")})
        </h2>
      </div>
      {list.map((b) => (
        <div
          key={`${b.surah}:${b.ayah}:${b.addedAt}`}
          className="rounded-xl border p-4 backdrop-blur-sm transition-all hover:shadow-md"
          style={{ backgroundColor: `${themeCardBg}cc`, borderColor: `${themeMutedText}25` }}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <button
              onClick={() => onSelectVerse(b.surah, b.ayah)}
              className="flex items-center gap-2 font-arabic text-sm font-semibold hover:underline"
              style={{ color: themeAccentColor }}
            >
              <BookOpen className="w-4 h-4" />
              سورة {b.surahNameArabic} • آية {b.ayah.toLocaleString("ar-EG")}
            </button>
            <button
              onClick={() => removeBookmark(b.surah, b.ayah)}
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
              title="حذف"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
          <p
            className="font-arabic text-base leading-loose cursor-pointer"
            style={{ color: themeTextColor }}
            onClick={() => onSelectVerse(b.surah, b.ayah)}
          >
            {b.arabicPreview}
          </p>
        </div>
      ))}
    </div>
  );
}
