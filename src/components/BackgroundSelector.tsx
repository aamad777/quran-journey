import { Wallpaper } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export type BackgroundPattern =
  | "none"
  | "geometric"
  | "stars"
  | "arabesque"
  | "mosque"
  | "crescents"
  | "tiles";

interface PatternInfo {
  id: BackgroundPattern;
  labelAr: string;
  svg: string;
}

const PATTERNS: PatternInfo[] = [
  {
    id: "none",
    labelAr: "بدون",
    svg: "",
  },
  {
    id: "geometric",
    labelAr: "هندسي",
    svg: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8a45a' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: "stars",
    labelAr: "نجوم",
    svg: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8a45a' fill-opacity='0.05'%3E%3Cpath d='M40 10l2.35 7.24h7.61l-6.16 4.47 2.35 7.24L40 24.48l-6.15 4.47 2.35-7.24-6.16-4.47h7.61L40 10zm-30 30l2.35 7.24h7.61l-6.16 4.47 2.35 7.24L10 54.48l-6.15 4.47 2.35-7.24-6.16-4.47h7.61L10 40zm60 0l2.35 7.24h7.61l-6.16 4.47 2.35 7.24L70 54.48l-6.15 4.47 2.35-7.24-6.16-4.47h7.61L70 40z'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: "arabesque",
    labelAr: "أرابيسك",
    svg: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8a45a' fill-opacity='0.05'%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23c8a45a' stroke-opacity='0.06' stroke-width='1'/%3E%3Ccircle cx='50' cy='50' r='35' fill='none' stroke='%23c8a45a' stroke-opacity='0.04' stroke-width='1'/%3E%3Ccircle cx='0' cy='0' r='15' fill='none' stroke='%23c8a45a' stroke-opacity='0.05' stroke-width='1'/%3E%3Ccircle cx='100' cy='0' r='15' fill='none' stroke='%23c8a45a' stroke-opacity='0.05' stroke-width='1'/%3E%3Ccircle cx='0' cy='100' r='15' fill='none' stroke='%23c8a45a' stroke-opacity='0.05' stroke-width='1'/%3E%3Ccircle cx='100' cy='100' r='15' fill='none' stroke='%23c8a45a' stroke-opacity='0.05' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: "mosque",
    labelAr: "مسجد",
    svg: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23c8a45a' stroke-opacity='0.05' stroke-width='1'%3E%3Cpath d='M60 20 Q60 5 60 20 Q45 10 60 20 Q75 10 60 20z'/%3E%3Cpath d='M40 60 L40 40 Q50 25 60 40 Q70 25 80 40 L80 60'/%3E%3Cpath d='M35 60 L85 60 L85 80 L35 80z'/%3E%3Cpath d='M55 60 L55 80 L65 80 L65 60' fill='%23c8a45a' fill-opacity='0.03'/%3E%3Ccircle cx='60' cy='15' r='3' fill='%23c8a45a' fill-opacity='0.04'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: "crescents",
    labelAr: "أهلّة",
    svg: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8a45a' fill-opacity='0.05'%3E%3Cpath d='M40 15a15 15 0 010 30 12 12 0 000-30z'/%3E%3Cpath d='M62 8l1.5 4.5L68 14l-4.5 1.5L62 20l-1.5-4.5L56 14l4.5-1.5z'/%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: "tiles",
    labelAr: "بلاط",
    svg: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23c8a45a' stroke-opacity='0.06' stroke-width='0.8'%3E%3Crect x='8' y='8' width='16' height='16' rx='2'/%3E%3Crect x='40' y='8' width='16' height='16' rx='2'/%3E%3Crect x='24' y='24' width='16' height='16' rx='2'/%3E%3Crect x='8' y='40' width='16' height='16' rx='2'/%3E%3Crect x='40' y='40' width='16' height='16' rx='2'/%3E%3C/g%3E%3C/svg%3E")`,
  },
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
                backgroundImage: p.svg || "none",
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
                  <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
