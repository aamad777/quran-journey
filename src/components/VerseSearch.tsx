import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchResult {
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  numberInSurah: number;
  text: string;
}

interface VerseSearchProps {
  onSelectVerse: (surahNumber: number, ayahNumber: number) => void;
  themeTextColor: string;
  themeMutedText: string;
  themeCardBg: string;
  themeAccentColor: string;
}

const VerseSearch = ({
  onSelectVerse,
  themeTextColor,
  themeMutedText,
  themeCardBg,
  themeAccentColor,
}: VerseSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/ar`);
      const data = await res.json();
      
      if (data.code === 200 && data.data && data.data.matches) {
        setResults(data.data.matches);
      } else {
        setResults([]);
        setError("لم يتم العثور على نتائج.");
      }
    } catch (err) {
      setError("حدث خطأ أثناء البحث.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div 
        className="p-6 rounded-2xl border backdrop-blur-sm"
        style={{ "--themed-card-bg": themeCardBg as any, borderColor: `${themeMutedText}30` }}
      >
        <h2 className="text-xl font-bold font-arabic mb-4 text-center" style={{ color: themeTextColor }}>
          البحث في القرآن
        </h2>
        
        <form onSubmit={handleSearch} className="flex gap-2 relative">
          <Input 
            type="text"
            placeholder="ابحث عن آية أو كلمة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-right font-arabic"
            dir="rtl"
            style={{ 
              backgroundColor: `${themeCardBg}80`, 
              color: themeTextColor,
              borderColor: `${themeMutedText}30`
            }}
          />
          <Button 
            type="submit" 
            disabled={loading || !query.trim()}
            style={{ backgroundColor: themeAccentColor, color: "#fff" }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>
      </div>

      {error && (
        <div className="p-4 text-center rounded-xl font-arabic text-red-500 bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4 pb-20">
          <p className="text-sm font-arabic text-right mb-2" style={{ color: themeMutedText }}>
            تم العثور على {results.length} نتيجة
          </p>
          {results.map((result, idx) => (
            <button
              key={`${result.surah.number}-${result.numberInSurah}-${idx}`}
              onClick={() => onSelectVerse(result.surah.number, result.numberInSurah)}
              className="w-full p-4 rounded-xl border text-right transition-all hover:scale-[1.01] active:scale-95 flex flex-col gap-2"
              style={{ 
                "--themed-card-bg": themeCardBg as any, 
                borderColor: `${themeMutedText}30`,
              }}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ backgroundColor: `${themeAccentColor}20`, color: themeAccentColor }}>
                  آية {result.numberInSurah}
                </span>
                <span className="font-arabic font-bold text-sm" style={{ color: themeAccentColor }}>
                  {result.surah.name}
                </span>
              </div>
              <p className="font-arabic text-lg leading-loose" style={{ color: themeTextColor }}>
                {result.text}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerseSearch;
