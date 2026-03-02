import { useState } from "react";
import { BookOpen, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SURAHS = [
  { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", ayahs: 7, type: "Meccan" },
  { number: 2, name: "Al-Baqarah", arabic: "البقرة", ayahs: 286, type: "Medinan" },
  { number: 3, name: "Aal-E-Imran", arabic: "آل عمران", ayahs: 200, type: "Medinan" },
  { number: 4, name: "An-Nisa", arabic: "النساء", ayahs: 176, type: "Medinan" },
  { number: 5, name: "Al-Ma'idah", arabic: "المائدة", ayahs: 120, type: "Medinan" },
  { number: 6, name: "Al-An'am", arabic: "الأنعام", ayahs: 165, type: "Meccan" },
  { number: 7, name: "Al-A'raf", arabic: "الأعراف", ayahs: 206, type: "Meccan" },
  { number: 8, name: "Al-Anfal", arabic: "الأنفال", ayahs: 75, type: "Medinan" },
  { number: 9, name: "At-Tawbah", arabic: "التوبة", ayahs: 129, type: "Medinan" },
  { number: 10, name: "Yunus", arabic: "يونس", ayahs: 109, type: "Meccan" },
  { number: 11, name: "Hud", arabic: "هود", ayahs: 123, type: "Meccan" },
  { number: 12, name: "Yusuf", arabic: "يوسف", ayahs: 111, type: "Meccan" },
  { number: 13, name: "Ar-Ra'd", arabic: "الرعد", ayahs: 43, type: "Medinan" },
  { number: 14, name: "Ibrahim", arabic: "إبراهيم", ayahs: 52, type: "Meccan" },
  { number: 15, name: "Al-Hijr", arabic: "الحجر", ayahs: 99, type: "Meccan" },
  { number: 16, name: "An-Nahl", arabic: "النحل", ayahs: 128, type: "Meccan" },
  { number: 17, name: "Al-Isra", arabic: "الإسراء", ayahs: 111, type: "Meccan" },
  { number: 18, name: "Al-Kahf", arabic: "الكهف", ayahs: 110, type: "Meccan" },
  { number: 19, name: "Maryam", arabic: "مريم", ayahs: 98, type: "Meccan" },
  { number: 20, name: "Taha", arabic: "طه", ayahs: 135, type: "Meccan" },
  { number: 21, name: "Al-Anbiya", arabic: "الأنبياء", ayahs: 112, type: "Meccan" },
  { number: 22, name: "Al-Hajj", arabic: "الحج", ayahs: 78, type: "Medinan" },
  { number: 23, name: "Al-Mu'minun", arabic: "المؤمنون", ayahs: 118, type: "Meccan" },
  { number: 24, name: "An-Nur", arabic: "النور", ayahs: 64, type: "Medinan" },
  { number: 25, name: "Al-Furqan", arabic: "الفرقان", ayahs: 77, type: "Meccan" },
  { number: 26, name: "Ash-Shu'ara", arabic: "الشعراء", ayahs: 227, type: "Meccan" },
  { number: 27, name: "An-Naml", arabic: "النمل", ayahs: 93, type: "Meccan" },
  { number: 28, name: "Al-Qasas", arabic: "القصص", ayahs: 88, type: "Meccan" },
  { number: 29, name: "Al-Ankabut", arabic: "العنكبوت", ayahs: 69, type: "Meccan" },
  { number: 30, name: "Ar-Rum", arabic: "الروم", ayahs: 60, type: "Meccan" },
  { number: 31, name: "Luqman", arabic: "لقمان", ayahs: 34, type: "Meccan" },
  { number: 32, name: "As-Sajdah", arabic: "السجدة", ayahs: 30, type: "Meccan" },
  { number: 33, name: "Al-Ahzab", arabic: "الأحزاب", ayahs: 73, type: "Medinan" },
  { number: 34, name: "Saba", arabic: "سبأ", ayahs: 54, type: "Meccan" },
  { number: 35, name: "Fatir", arabic: "فاطر", ayahs: 45, type: "Meccan" },
  { number: 36, name: "Ya-Sin", arabic: "يس", ayahs: 83, type: "Meccan" },
  { number: 37, name: "As-Saffat", arabic: "الصافات", ayahs: 182, type: "Meccan" },
  { number: 38, name: "Sad", arabic: "ص", ayahs: 88, type: "Meccan" },
  { number: 39, name: "Az-Zumar", arabic: "الزمر", ayahs: 75, type: "Meccan" },
  { number: 40, name: "Ghafir", arabic: "غافر", ayahs: 85, type: "Meccan" },
  { number: 41, name: "Fussilat", arabic: "فصلت", ayahs: 54, type: "Meccan" },
  { number: 42, name: "Ash-Shura", arabic: "الشورى", ayahs: 53, type: "Meccan" },
  { number: 43, name: "Az-Zukhruf", arabic: "الزخرف", ayahs: 89, type: "Meccan" },
  { number: 44, name: "Ad-Dukhan", arabic: "الدخان", ayahs: 59, type: "Meccan" },
  { number: 45, name: "Al-Jathiyah", arabic: "الجاثية", ayahs: 37, type: "Meccan" },
  { number: 46, name: "Al-Ahqaf", arabic: "الأحقاف", ayahs: 35, type: "Meccan" },
  { number: 47, name: "Muhammad", arabic: "محمد", ayahs: 38, type: "Medinan" },
  { number: 48, name: "Al-Fath", arabic: "الفتح", ayahs: 29, type: "Medinan" },
  { number: 49, name: "Al-Hujurat", arabic: "الحجرات", ayahs: 18, type: "Medinan" },
  { number: 50, name: "Qaf", arabic: "ق", ayahs: 45, type: "Meccan" },
  { number: 51, name: "Adh-Dhariyat", arabic: "الذاريات", ayahs: 60, type: "Meccan" },
  { number: 52, name: "At-Tur", arabic: "الطور", ayahs: 49, type: "Meccan" },
  { number: 53, name: "An-Najm", arabic: "النجم", ayahs: 62, type: "Meccan" },
  { number: 54, name: "Al-Qamar", arabic: "القمر", ayahs: 55, type: "Meccan" },
  { number: 55, name: "Ar-Rahman", arabic: "الرحمن", ayahs: 78, type: "Medinan" },
  { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", ayahs: 96, type: "Meccan" },
  { number: 57, name: "Al-Hadid", arabic: "الحديد", ayahs: 29, type: "Medinan" },
  { number: 58, name: "Al-Mujadila", arabic: "المجادلة", ayahs: 22, type: "Medinan" },
  { number: 59, name: "Al-Hashr", arabic: "الحشر", ayahs: 24, type: "Medinan" },
  { number: 60, name: "Al-Mumtahanah", arabic: "الممتحنة", ayahs: 13, type: "Medinan" },
  { number: 61, name: "As-Saff", arabic: "الصف", ayahs: 14, type: "Medinan" },
  { number: 62, name: "Al-Jumu'ah", arabic: "الجمعة", ayahs: 11, type: "Medinan" },
  { number: 63, name: "Al-Munafiqun", arabic: "المنافقون", ayahs: 11, type: "Medinan" },
  { number: 64, name: "At-Taghabun", arabic: "التغابن", ayahs: 18, type: "Medinan" },
  { number: 65, name: "At-Talaq", arabic: "الطلاق", ayahs: 12, type: "Medinan" },
  { number: 66, name: "At-Tahrim", arabic: "التحريم", ayahs: 12, type: "Medinan" },
  { number: 67, name: "Al-Mulk", arabic: "الملك", ayahs: 30, type: "Meccan" },
  { number: 68, name: "Al-Qalam", arabic: "القلم", ayahs: 52, type: "Meccan" },
  { number: 69, name: "Al-Haqqah", arabic: "الحاقة", ayahs: 52, type: "Meccan" },
  { number: 70, name: "Al-Ma'arij", arabic: "المعارج", ayahs: 44, type: "Meccan" },
  { number: 71, name: "Nuh", arabic: "نوح", ayahs: 28, type: "Meccan" },
  { number: 72, name: "Al-Jinn", arabic: "الجن", ayahs: 28, type: "Meccan" },
  { number: 73, name: "Al-Muzzammil", arabic: "المزمل", ayahs: 20, type: "Meccan" },
  { number: 74, name: "Al-Muddaththir", arabic: "المدثر", ayahs: 56, type: "Meccan" },
  { number: 75, name: "Al-Qiyamah", arabic: "القيامة", ayahs: 40, type: "Meccan" },
  { number: 76, name: "Al-Insan", arabic: "الإنسان", ayahs: 31, type: "Medinan" },
  { number: 77, name: "Al-Mursalat", arabic: "المرسلات", ayahs: 50, type: "Meccan" },
  { number: 78, name: "An-Naba", arabic: "النبأ", ayahs: 40, type: "Meccan" },
  { number: 79, name: "An-Nazi'at", arabic: "النازعات", ayahs: 46, type: "Meccan" },
  { number: 80, name: "Abasa", arabic: "عبس", ayahs: 42, type: "Meccan" },
  { number: 81, name: "At-Takwir", arabic: "التكوير", ayahs: 29, type: "Meccan" },
  { number: 82, name: "Al-Infitar", arabic: "الانفطار", ayahs: 19, type: "Meccan" },
  { number: 83, name: "Al-Mutaffifin", arabic: "المطففين", ayahs: 36, type: "Meccan" },
  { number: 84, name: "Al-Inshiqaq", arabic: "الانشقاق", ayahs: 25, type: "Meccan" },
  { number: 85, name: "Al-Buruj", arabic: "البروج", ayahs: 22, type: "Meccan" },
  { number: 86, name: "At-Tariq", arabic: "الطارق", ayahs: 17, type: "Meccan" },
  { number: 87, name: "Al-A'la", arabic: "الأعلى", ayahs: 19, type: "Meccan" },
  { number: 88, name: "Al-Ghashiyah", arabic: "الغاشية", ayahs: 26, type: "Meccan" },
  { number: 89, name: "Al-Fajr", arabic: "الفجر", ayahs: 30, type: "Meccan" },
  { number: 90, name: "Al-Balad", arabic: "البلد", ayahs: 20, type: "Meccan" },
  { number: 91, name: "Ash-Shams", arabic: "الشمس", ayahs: 15, type: "Meccan" },
  { number: 92, name: "Al-Layl", arabic: "الليل", ayahs: 21, type: "Meccan" },
  { number: 93, name: "Ad-Duha", arabic: "الضحى", ayahs: 11, type: "Meccan" },
  { number: 94, name: "Ash-Sharh", arabic: "الشرح", ayahs: 8, type: "Meccan" },
  { number: 95, name: "At-Tin", arabic: "التين", ayahs: 8, type: "Meccan" },
  { number: 96, name: "Al-Alaq", arabic: "العلق", ayahs: 19, type: "Meccan" },
  { number: 97, name: "Al-Qadr", arabic: "القدر", ayahs: 5, type: "Meccan" },
  { number: 98, name: "Al-Bayyinah", arabic: "البينة", ayahs: 8, type: "Medinan" },
  { number: 99, name: "Az-Zalzalah", arabic: "الزلزلة", ayahs: 8, type: "Medinan" },
  { number: 100, name: "Al-Adiyat", arabic: "العاديات", ayahs: 11, type: "Meccan" },
  { number: 101, name: "Al-Qari'ah", arabic: "القارعة", ayahs: 11, type: "Meccan" },
  { number: 102, name: "At-Takathur", arabic: "التكاثر", ayahs: 8, type: "Meccan" },
  { number: 103, name: "Al-Asr", arabic: "العصر", ayahs: 3, type: "Meccan" },
  { number: 104, name: "Al-Humazah", arabic: "الهمزة", ayahs: 9, type: "Meccan" },
  { number: 105, name: "Al-Fil", arabic: "الفيل", ayahs: 5, type: "Meccan" },
  { number: 106, name: "Quraysh", arabic: "قريش", ayahs: 4, type: "Meccan" },
  { number: 107, name: "Al-Ma'un", arabic: "الماعون", ayahs: 7, type: "Meccan" },
  { number: 108, name: "Al-Kawthar", arabic: "الكوثر", ayahs: 3, type: "Meccan" },
  { number: 109, name: "Al-Kafirun", arabic: "الكافرون", ayahs: 6, type: "Meccan" },
  { number: 110, name: "An-Nasr", arabic: "النصر", ayahs: 3, type: "Medinan" },
  { number: 111, name: "Al-Masad", arabic: "المسد", ayahs: 5, type: "Meccan" },
  { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", ayahs: 4, type: "Meccan" },
  { number: 113, name: "Al-Falaq", arabic: "الفلق", ayahs: 5, type: "Meccan" },
  { number: 114, name: "An-Nas", arabic: "الناس", ayahs: 6, type: "Meccan" },
];

interface SurahListProps {
  currentSurah: number;
  onSelect: (surahNumber: number) => void;
}

const SurahList = ({ currentSurah, onSelect }: SurahListProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = SURAHS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.arabic.includes(search) ||
      s.number.toString() === search
  );

  const handleSelect = (surahNumber: number) => {
    onSelect(surahNumber);
    setOpen(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-border hover:bg-primary/10">
          <BookOpen className="w-4 h-4 mr-2" />
          Surahs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="font-display text-lg">Browse Surahs</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px] px-2 pb-2">
          <div className="space-y-0.5 px-2">
            {filtered.map((surah) => (
              <button
                key={surah.number}
                onClick={() => handleSelect(surah.number)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  surah.number === currentSurah
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/60"
                }`}
              >
                <div className="w-9 h-9 rounded-lg gradient-islamic flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-gold">{surah.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{surah.name}</span>
                    <span className="font-arabic text-base text-gold shrink-0 ml-2">{surah.arabic}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{surah.ayahs} Ayahs</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{surah.type}</span>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No surahs found</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SurahList;
