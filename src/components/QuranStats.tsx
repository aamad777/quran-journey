import { BookOpen, Layers, Grid3X3, FileText, Mic, PenTool, Flame, Target, Award } from "lucide-react";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { ACHIEVEMENTS, type GamiState } from "@/lib/gamification";

// Juz boundaries: [surah, ayah] for the start of each juz (1-30)
const JUZ_STARTS: [number, number][] = [
  [1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,83],[6,111],[7,88],[8,41],
  [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
  [29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]
];

const HIZB_STARTS: [number, number][] = [
  [1,1],[2,26],[2,142],[2,203],[2,253],[3,15],[3,93],[3,171],
  [4,24],[4,88],[4,148],[5,27],[5,83],[6,36],[6,111],[6,165],
  [7,88],[7,171],[8,41],[9,34],[9,93],[10,26],[11,6],[11,84],
  [12,53],[13,19],[15,1],[16,51],[17,1],[17,99],[18,75],[19,59],
  [21,1],[22,1],[23,1],[24,21],[25,21],[26,111],[27,56],[28,51],
  [29,46],[31,22],[33,31],[34,24],[36,28],[37,145],[39,32],[40,41],
  [41,47],[43,24],[46,1],[48,18],[51,31],[54,28],[58,1],[60,7],
  [67,1],[71,1],[78,1],[84,1]
];

const SURAH_AYAH_COUNT = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
  59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
  52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
  21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6
];

function getAbsoluteAyah(surah: number, ayah: number): number {
  let total = 0;
  for (let i = 0; i < surah - 1; i++) total += SURAH_AYAH_COUNT[i];
  return total + ayah;
}

function getCurrentPart(surah: number, ayah: number, starts: [number, number][]): number {
  const abs = getAbsoluteAyah(surah, ayah);
  let current = 1;
  for (let i = 0; i < starts.length; i++) {
    const startAbs = getAbsoluteAyah(starts[i][0], starts[i][1]);
    if (abs >= startAbs) current = i + 1;
    else break;
  }
  return current;
}

interface QuranStatsProps {
  surahNumber: number;
  ayahNumber: number;
  versesRead: number;
  versesRemaining: number;
  progressPercent: number;
  voiceCorrect: number;
  drawCorrect: number;
  gami?: GamiState;
  onSetDailyGoal?: (n: number) => void;
}

export default function QuranStats({ surahNumber, ayahNumber, versesRead, versesRemaining, progressPercent, voiceCorrect, drawCorrect, gami, onSetDailyGoal }: QuranStatsProps) {
  const currentJuz = getCurrentPart(surahNumber, ayahNumber, JUZ_STARTS);
  const currentHizb = getCurrentPart(surahNumber, ayahNumber, HIZB_STARTS);
  const completedJuz = currentJuz - 1;
  const completedHizb = currentHizb - 1;
  const completedSurahs = surahNumber - 1;
  const juzPercent = Math.round((completedJuz / 30) * 100);
  const hizbPercent = Math.round((completedHizb / 60) * 100);
  const surahPercent = Math.round((completedSurahs / 114) * 100);

  const stats = [
    { icon: FileText, label: "الآيات", value: `${versesRead.toLocaleString("ar-EG")} / ٦٬٢٣٦`, percent: progressPercent, detail: `${versesRemaining.toLocaleString("ar-EG")} متبقية` },
    { icon: Layers, label: "الأجزاء", value: `${completedJuz.toLocaleString("ar-EG")} / ٣٠`, percent: juzPercent, detail: `الجزء الحالي: ${currentJuz.toLocaleString("ar-EG")}` },
    { icon: Grid3X3, label: "الأحزاب", value: `${completedHizb.toLocaleString("ar-EG")} / ٦٠`, percent: hizbPercent, detail: `الحزب الحالي: ${currentHizb.toLocaleString("ar-EG")}` },
    { icon: BookOpen, label: "السور", value: `${completedSurahs.toLocaleString("ar-EG")} / ١١٤`, percent: surahPercent, detail: `السورة الحالية: ${surahNumber.toLocaleString("ar-EG")}` },
    { icon: Mic, label: "صوت صحيح", value: voiceCorrect.toLocaleString("ar-EG"), percent: null as number | null, detail: "كلمات نُطقت بدون تخطي" },
    { icon: PenTool, label: "رسم صحيح", value: drawCorrect.toLocaleString("ar-EG"), percent: null as number | null, detail: "كلمات رُسمت بدون تخطي" },
  ];

  const dailyPercent = gami ? Math.min(100, Math.round((gami.todayCount / Math.max(1, gami.dailyGoal)) * 100)) : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {gami && (
        <>
          {/* Streak + Daily Goal hero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-orange-500/10 to-red-500/5 p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-500/15 flex items-center justify-center">
                <Flame className={`w-7 h-7 ${gami.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} style={{ filter: gami.streak > 0 ? "drop-shadow(0 0 8px rgba(249,115,22,0.6))" : undefined }} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-arabic">سلسلة متتالية</div>
                <div className="text-2xl font-bold">{gami.streak.toLocaleString("ar-EG")} <span className="text-sm font-normal text-muted-foreground">يوم</span></div>
                <div className="text-[11px] text-muted-foreground font-arabic">الأفضل: {gami.bestStreak.toLocaleString("ar-EG")}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold font-arabic">الهدف اليومي</span>
                </div>
                <span className="text-sm font-bold text-primary">{gami.todayCount.toLocaleString("ar-EG")}/{gami.dailyGoal.toLocaleString("ar-EG")}</span>
              </div>
              <ProgressBar value={dailyPercent} className="h-2 mb-2" />
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-muted-foreground font-arabic whitespace-nowrap">اضبط الهدف:</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  defaultValue={gami.dailyGoal}
                  onBlur={(e) => onSetDailyGoal?.(parseInt(e.target.value) || 10)}
                  className="w-16 h-7 px-2 rounded-md border border-border bg-background text-xs text-center"
                />
                <span className="text-[11px] text-muted-foreground font-arabic">آية</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold font-arabic">الإنجازات</span>
              </div>
              <div className="text-2xl font-bold">{gami.achievements.length} <span className="text-sm font-normal text-muted-foreground">/ {ACHIEVEMENTS.length}</span></div>
              <div className="text-[11px] text-muted-foreground font-arabic">{gami.totalVerses.toLocaleString("ar-EG")} آية إجمالاً</div>
            </div>
          </div>

          {/* Achievements grid */}
          <div>
            <h3 className="font-arabic text-sm font-bold mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> شارات الإنجاز
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = gami.achievements.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`rounded-xl border p-3 text-center transition-all ${unlocked ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20 opacity-50 grayscale"}`}
                  >
                    <div className="text-2xl mb-1">{a.emoji}</div>
                    <div className="text-[11px] font-arabic font-bold">{a.labelAr}</div>
                    <div className="text-[10px] text-muted-foreground font-arabic mt-0.5">{a.descAr}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div>
        <h3 className="font-arabic text-sm font-bold mb-2">إحصائيات القراءة</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card/70 backdrop-blur-sm border border-border rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <stat.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">{stat.label}</span>
              </div>
              <span className="text-lg font-bold text-primary">{stat.value}</span>
              {stat.percent !== null && <ProgressBar value={stat.percent} className="h-1.5" />}
              <span className="text-[10px] text-muted-foreground">{stat.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
