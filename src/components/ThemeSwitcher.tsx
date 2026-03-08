import { THEMES, ThemeColor, ThemeMode } from "@/hooks/useTheme";
import { Palette, Sun, Moon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ThemeSwitcherProps {
  theme: ThemeColor;
  setTheme: (t: ThemeColor) => void;
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeSwitcher = ({ theme, setTheme, mode, toggleMode }: ThemeSwitcherProps) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full border-border"
        onClick={toggleMode}
        title={mode === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
      >
        {mode === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full border-border">
            <Palette className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" align="end">
          <p className="text-xs text-muted-foreground mb-2 font-arabic text-right">اختر الثيم</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center border-2 ${
                  theme === t.id ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: t.preview }}
                title={t.labelAr}
              >
                {theme === t.id && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ThemeSwitcher;
