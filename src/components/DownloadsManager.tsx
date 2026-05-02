import { useEffect, useState, useCallback } from "react";
import { Download, Trash2, Loader2, CheckCircle2, HardDrive, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  RECITERS,
  getReciterById,
  resolveAyahAudioUrl,
  type Reciter,
} from "@/lib/reciters";
import {
  downloadAndCache,
  hasCached,
  getCacheStats,
  clearReciter,
  clearAll,
  formatBytes,
  type CacheStats,
} from "@/lib/audioCache";

const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
  49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
  26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
  6, 3, 5, 4, 5, 6,
];

const SURAH_NAMES = [
  "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس",
  "هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه",
  "الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم",
  "لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر",
  "فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق",
  "الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
  "الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج",
  "نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
  "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد",
  "الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات",
  "القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
  "المسد","الإخلاص","الفلق","الناس",
];

interface Props {
  themeTextColor: string;
  themeMutedText: string;
  themeCardBg: string;
  themeAccentColor: string;
}

const DownloadsManager = ({
  themeTextColor,
  themeMutedText,
  themeCardBg,
  themeAccentColor,
}: Props) => {
  const [reciterId, setReciterId] = useState<string>(RECITERS[0].id);
  const [surahNum, setSurahNum] = useState<number>(1);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [cancelRef, setCancelRef] = useState<{ cancel: boolean }>({ cancel: false });

  const refreshStats = useCallback(async () => {
    setStats(await getCacheStats());
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const reciter: Reciter = getReciterById(reciterId);
  const isSurahLevel = reciter.source.type === "mp3quran";
  const isAlquranApi = reciter.source.type === "alquran";
  const ayahCount = SURAH_AYAH_COUNTS[surahNum - 1];

  const startDownload = async () => {
    setBusy(true);
    setProgress(0);
    const cancel = { cancel: false };
    setCancelRef(cancel);

    try {
      // Build the list of (url, ayah) tuples to fetch.
      const tasks: Array<{ url: string; ayah: number }> = [];

      if (isSurahLevel) {
        const url = await resolveAyahAudioUrl(reciter, surahNum, 1);
        if (url) tasks.push({ url, ayah: 0 });
      } else if (isAlquranApi) {
        // Resolve URLs in small batches to avoid overwhelming the API.
        setProgressLabel("جاري جلب روابط الصوت...");
        for (let a = 1; a <= ayahCount; a++) {
          if (cancel.cancel) break;
          const url = await resolveAyahAudioUrl(reciter, surahNum, a);
          if (url) tasks.push({ url, ayah: a });
          setProgress(Math.round((a / ayahCount) * 30)); // 0–30% for resolving
        }
      } else {
        // everyayah — direct URLs, no API calls needed
        for (let a = 1; a <= ayahCount; a++) {
          const url = await resolveAyahAudioUrl(reciter, surahNum, a);
          if (url) tasks.push({ url, ayah: a });
        }
      }

      // Now fetch + cache each blob.
      let saved = 0;
      let already = 0;
      let failed = 0;
      const startPct = isAlquranApi ? 30 : 0;
      const span = 100 - startPct;

      for (let i = 0; i < tasks.length; i++) {
        if (cancel.cancel) break;
        const t = tasks[i];
        setProgressLabel(
          isSurahLevel
            ? `جاري تنزيل سورة ${SURAH_NAMES[surahNum - 1]}...`
            : `الآية ${i + 1} من ${tasks.length}`,
        );
        try {
          const wasNew = await downloadAndCache(t.url, {
            reciter: reciterId,
            surah: surahNum,
            ayah: t.ayah,
          });
          if (wasNew) saved++;
          else already++;
        } catch (e) {
          failed++;
          console.error("Download failed:", e);
        }
        setProgress(startPct + Math.round(((i + 1) / tasks.length) * span));
      }

      toast({
        title: cancel.cancel ? "تم الإيقاف" : "اكتمل التحميل",
        description: `${saved} جديد · ${already} موجود${failed ? ` · ${failed} فشل` : ""}`,
      });
    } catch (e) {
      console.error(e);
      toast({ title: "حدث خطأ أثناء التحميل", variant: "destructive" });
    } finally {
      setBusy(false);
      setProgress(0);
      setProgressLabel("");
      refreshStats();
    }
  };

  const cancelDownload = () => {
    cancelRef.cancel = true;
  };

  const handleClearReciter = async (rid: string) => {
    await clearReciter(rid);
    toast({ title: "تم حذف ملفات القارئ" });
    refreshStats();
  };

  const handleClearAll = async () => {
    if (!confirm("حذف جميع الملفات الصوتية المحفوظة؟")) return;
    await clearAll();
    toast({ title: "تم مسح جميع الملفات" });
    refreshStats();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4" dir="rtl">
      {/* Storage usage card */}
      <div
        className="rounded-2xl p-5 backdrop-blur-md"
        style={{
          "--themed-card-bg": themeCardBg as any,
          border: `1px solid ${themeMutedText}20`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${themeAccentColor}15` }}
          >
            <HardDrive className="w-5 h-5" style={{ color: themeAccentColor }} />
          </div>
          <div className="flex-1">
            <h3 className="font-arabic font-bold text-base" style={{ color: themeTextColor }}>
              المساحة المستخدمة
            </h3>
            <p className="text-xs" style={{ color: themeMutedText }}>
              {stats
                ? `${stats.totalCount} ملف · ${formatBytes(stats.totalBytes)}`
                : "جاري الحساب..."}
            </p>
          </div>
          {stats && stats.totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 ml-1" />
              مسح الكل
            </Button>
          )}
        </div>

        {stats && Object.keys(stats.byReciter).length > 0 && (
          <div className="space-y-2 pt-3 border-t" style={{ borderColor: `${themeMutedText}15` }}>
            {Object.entries(stats.byReciter).map(([rid, info]) => {
              const r = RECITERS.find((x) => x.id === rid);
              return (
                <div
                  key={rid}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" style={{ color: themeAccentColor }} />
                    <span className="font-arabic" style={{ color: themeTextColor }}>
                      {r?.name || rid}
                    </span>
                    <span className="text-xs" style={{ color: themeMutedText }}>
                      ({info.count} · {formatBytes(info.bytes)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleClearReciter(rid)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Download form */}
      <div
        className="rounded-2xl p-5 backdrop-blur-md space-y-4"
        style={{
          "--themed-card-bg": themeCardBg as any,
          border: `1px solid ${themeMutedText}20`,
        }}
      >
        <h3 className="font-arabic font-bold text-base" style={{ color: themeTextColor }}>
          تحميل سورة للاستماع بدون إنترنت
        </h3>

        <div className="space-y-2">
          <label className="text-xs font-arabic" style={{ color: themeMutedText }}>
            القارئ
          </label>
          <Select value={reciterId} onValueChange={setReciterId} disabled={busy}>
            <SelectTrigger className="font-arabic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {RECITERS.map((r) => (
                <SelectItem key={r.id} value={r.id} className="font-arabic">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-arabic" style={{ color: themeMutedText }}>
            السورة {!isSurahLevel && `(${ayahCount} آية)`}
          </label>
          <Select
            value={String(surahNum)}
            onValueChange={(v) => setSurahNum(parseInt(v))}
            disabled={busy}
          >
            <SelectTrigger className="font-arabic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {SURAH_NAMES.map((name, idx) => (
                <SelectItem key={idx} value={String(idx + 1)} className="font-arabic">
                  {idx + 1}. {name} ({SURAH_AYAH_COUNTS[idx]} آية)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAlquranApi && !isSurahLevel && ayahCount > 50 && (
          <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-arabic text-amber-700 dark:text-amber-400 leading-relaxed">
              هذا القارئ يتطلب جلب الروابط من API قبل التنزيل. السور الطويلة قد
              تستغرق وقتاً أطول.
            </p>
          </div>
        )}

        {busy && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: themeMutedText }}>{progressLabel}</span>
              <span style={{ color: themeTextColor }}>{progress}%</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!busy ? (
            <Button
              className="flex-1 gap-2 font-arabic"
              onClick={startDownload}
              style={{ backgroundColor: themeAccentColor }}
            >
              <Download className="w-4 h-4" />
              تنزيل
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 gap-2 font-arabic"
                disabled
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التحميل...
              </Button>
              <Button variant="destructive" onClick={cancelDownload} className="font-arabic">
                إيقاف
              </Button>
            </>
          )}
        </div>

        <p className="text-[11px] leading-relaxed font-arabic" style={{ color: themeMutedText }}>
          💡 الملفات تُحفظ على جهازك. عند تشغيل آية محفوظة، سيعمل الصوت تلقائياً
          بدون اتصال بالإنترنت.
        </p>
      </div>
    </div>
  );
};

export default DownloadsManager;
