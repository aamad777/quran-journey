import { BookOpen, Layers, Grid3X3, FileText } from "lucide-react";
import { Progress as ProgressBar } from "@/components/ui/progress";

// Juz boundaries: [surah, ayah] for the start of each juz (1-30)
const JUZ_STARTS: [number, number][] = [
  [1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,83],[6,111],[7,88],[8,41],
  [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
  [29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]
];

// Hizb = 60 parts (each juz has 2 hizbs). Hizb boundaries:
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
}

export default function QuranStats({ surahNumber, ayahNumber, versesRead, versesRemaining, progressPercent }: QuranStatsProps) {
  const currentJuz = getCurrentPart(surahNumber, ayahNumber, JUZ_STARTS);
  const currentHizb = getCurrentPart(surahNumber, ayahNumber, HIZB_STARTS);
  const completedJuz = currentJuz - 1;
  const completedHizb = currentHizb - 1;
  const completedSurahs = surahNumber - 1;
  const juzPercent = Math.round((completedJuz / 30) * 100);
  const hizbPercent = Math.round((completedHizb / 60) * 100);
  const surahPercent = Math.round((completedSurahs / 114) * 100);

  const stats = [
    {
      icon: FileText,
      label: "الآيات",
      value: `${versesRead.toLocaleString("ar-EG")} / ٦٬٢٣٦`,
      percent: progressPercent,
      detail: `${versesRemaining.toLocaleString("ar-EG")} متبقية`,
    },
    {
      icon: Layers,
      label: "الأجزاء",
      value: `${completedJuz.toLocaleString("ar-EG")} / ٣٠`,
      percent: juzPercent,
      detail: `الجزء الحالي: ${currentJuz.toLocaleString("ar-EG")}`,
    },
    {
      icon: Grid3X3,
      label: "الأحزاب",
      value: `${completedHizb.toLocaleString("ar-EG")} / ٦٠`,
      percent: hizbPercent,
      detail: `الحزب الحالي: ${currentHizb.toLocaleString("ar-EG")}`,
    },
    {
      icon: BookOpen,
      label: "السور",
      value: `${completedSurahs.toLocaleString("ar-EG")} / ١١٤`,
      percent: surahPercent,
      detail: `السورة الحالية: ${surahNumber.toLocaleString("ar-EG")}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card/70 backdrop-blur-sm border border-border rounded-xl p-3 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <stat.icon className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">{stat.label}</span>
          </div>
          <span className="text-lg font-bold text-primary">{stat.value}</span>
          <ProgressBar value={stat.percent} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground">{stat.detail}</span>
        </div>
      ))}
    </div>
  );
}
