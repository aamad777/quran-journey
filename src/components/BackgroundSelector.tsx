import { Wallpaper } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

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
}

const BackgroundSelector = ({ background, setBackground }: BackgroundSelectorProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full border-border">
          <Wallpaper className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" align="end">
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
      </PopoverContent>
    </Popover>
  );
};

export { PATTERNS };
export default BackgroundSelector;
