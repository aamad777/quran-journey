import { Wallpaper } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

import bgGeometric from "@/assets/bg-geometric.jpg";
import bgMosque from "@/assets/bg-mosque.jpg";
import bgArabesque from "@/assets/bg-arabesque.jpg";
import bgNight from "@/assets/bg-night.jpg";
import bgCalligraphy from "@/assets/bg-calligraphy.jpg";
import bgTiles from "@/assets/bg-tiles.jpg";

export type BackgroundPattern =
  | "none"
  | "geometric"
  | "mosque"
  | "arabesque"
  | "night"
  | "calligraphy"
  | "tiles";

interface PatternInfo {
  id: BackgroundPattern;
  labelAr: string;
  image: string | null;
}

export interface BgThemeColors {
  btnBg: string;
  btnText: string;
  btnOutlineBorder: string;
  btnOutlineText: string;
  activeWordColor: string;
  activeWordGlow: string;
  textColor: string;
  mutedText: string;
  cardBg: string;
}

export const BG_THEMES: Record<BackgroundPattern, BgThemeColors> = {
  none: {
    btnBg: "hsl(var(--primary))",
    btnText: "hsl(var(--primary-foreground))",
    btnOutlineBorder: "hsl(var(--border))",
    btnOutlineText: "hsl(var(--foreground))",
    activeWordColor: "hsl(38 65% 50%)",
    activeWordGlow: "0 0 12px hsl(38 65% 50% / 0.4)",
  },
  geometric: {
    btnBg: "hsl(38 70% 55%)",
    btnText: "hsl(220 30% 10%)",
    btnOutlineBorder: "hsl(38 50% 40% / 0.5)",
    btnOutlineText: "hsl(38 60% 80%)",
    activeWordColor: "hsl(38 80% 60%)",
    activeWordGlow: "0 0 14px hsl(38 80% 55% / 0.5)",
  },
  mosque: {
    btnBg: "hsl(35 60% 45%)",
    btnText: "hsl(40 30% 97%)",
    btnOutlineBorder: "hsl(35 40% 50% / 0.5)",
    btnOutlineText: "hsl(35 50% 30%)",
    activeWordColor: "hsl(25 70% 45%)",
    activeWordGlow: "0 0 14px hsl(25 70% 45% / 0.4)",
  },
  arabesque: {
    btnBg: "hsl(152 45% 35%)",
    btnText: "hsl(40 30% 97%)",
    btnOutlineBorder: "hsl(152 30% 40% / 0.5)",
    btnOutlineText: "hsl(152 40% 80%)",
    activeWordColor: "hsl(152 55% 50%)",
    activeWordGlow: "0 0 14px hsl(152 55% 45% / 0.5)",
  },
  night: {
    btnBg: "hsl(270 50% 50%)",
    btnText: "hsl(0 0% 100%)",
    btnOutlineBorder: "hsl(270 40% 50% / 0.5)",
    btnOutlineText: "hsl(270 40% 85%)",
    activeWordColor: "hsl(280 60% 70%)",
    activeWordGlow: "0 0 14px hsl(280 60% 65% / 0.5)",
  },
  calligraphy: {
    btnBg: "hsl(350 45% 35%)",
    btnText: "hsl(38 60% 80%)",
    btnOutlineBorder: "hsl(38 50% 45% / 0.5)",
    btnOutlineText: "hsl(38 60% 75%)",
    activeWordColor: "hsl(38 75% 60%)",
    activeWordGlow: "0 0 14px hsl(38 75% 55% / 0.5)",
  },
  tiles: {
    btnBg: "hsl(185 60% 40%)",
    btnText: "hsl(0 0% 100%)",
    btnOutlineBorder: "hsl(185 50% 45% / 0.5)",
    btnOutlineText: "hsl(200 60% 30%)",
    activeWordColor: "hsl(195 70% 45%)",
    activeWordGlow: "0 0 14px hsl(195 70% 40% / 0.5)",
  },
};

const PATTERNS: PatternInfo[] = [
  { id: "none", labelAr: "بدون", image: null },
  { id: "geometric", labelAr: "هندسي", image: bgGeometric },
  { id: "mosque", labelAr: "مسجد", image: bgMosque },
  { id: "arabesque", labelAr: "أرابيسك", image: bgArabesque },
  { id: "night", labelAr: "ليلي", image: bgNight },
  { id: "calligraphy", labelAr: "خط عربي", image: bgCalligraphy },
  { id: "tiles", labelAr: "بلاط", image: bgTiles },
];

interface BackgroundSelectorProps {
  background: BackgroundPattern;
  setBackground: (bg: BackgroundPattern) => void;
  opacity: number;
  setOpacity: (val: number) => void;
}

const BackgroundSelector = ({ background, setBackground, opacity, setOpacity }: BackgroundSelectorProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full border-border">
          <Wallpaper className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <p className="text-xs text-muted-foreground mb-2 font-arabic text-right">خلفية الصفحة</p>
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS.map((p) => (
            <button
              key={p.id}
              onClick={() => setBackground(p.id)}
              className={`relative h-14 rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                background === p.id
                  ? "border-primary scale-105 shadow-md"
                  : "border-border hover:border-muted-foreground/50 hover:scale-[1.02]"
              }`}
              style={{
                backgroundColor: "hsl(var(--background))",
                backgroundImage: p.image ? `url(${p.image})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              title={p.labelAr}
            >
              {p.id === "none" && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground font-arabic">
                  بدون
                </span>
              )}
              {background === p.id && (
                <span className="absolute bottom-0.5 right-0.5">
                  <svg className="w-3 h-3 text-primary drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
        {background !== "none" && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{Math.round(opacity * 100)}٪</span>
              <p className="text-xs text-muted-foreground font-arabic">شدة الخلفية</p>
            </div>
            <Slider
              value={[opacity * 100]}
              onValueChange={([val]) => setOpacity(val / 100)}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export { PATTERNS };
export default BackgroundSelector;
