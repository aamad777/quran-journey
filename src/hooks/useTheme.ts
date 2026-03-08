import { useState, useEffect, useCallback, useMemo } from "react";

export type ThemeColor = "emerald" | "ocean" | "royal" | "sunset" | "rose";

interface ThemeInfo {
  id: ThemeColor;
  label: string;
  labelAr: string;
  preview: string;
}

export const THEMES: ThemeInfo[] = [
  { id: "emerald", label: "Emerald", labelAr: "زمردي", preview: "#2d6a4f" },
  { id: "ocean", label: "Ocean", labelAr: "محيطي", preview: "#1e6091" },
  { id: "royal", label: "Royal", labelAr: "ملكي", preview: "#5b3a8c" },
  { id: "sunset", label: "Sunset", labelAr: "غروب", preview: "#b45309" },
  { id: "rose", label: "Rose", labelAr: "وردي", preview: "#9f1239" },
];

// Each theme defines CSS variable overrides
const THEME_VARS: Record<ThemeColor, Record<string, string>> = {
  emerald: {}, // default, no overrides needed
  ocean: {
    "--background": "210 30% 97%",
    "--foreground": "210 25% 15%",
    "--card": "210 25% 95%",
    "--card-foreground": "210 25% 15%",
    "--popover": "210 30% 97%",
    "--popover-foreground": "210 25% 15%",
    "--primary": "210 55% 35%",
    "--primary-foreground": "210 30% 97%",
    "--secondary": "200 40% 85%",
    "--secondary-foreground": "210 25% 15%",
    "--muted": "210 20% 92%",
    "--muted-foreground": "210 15% 45%",
    "--accent": "200 65% 50%",
    "--accent-foreground": "210 25% 15%",
    "--border": "200 25% 85%",
    "--input": "200 25% 85%",
    "--ring": "210 55% 35%",
    "--gold": "200 65% 50%",
    "--gold-light": "200 55% 70%",
    "--emerald-deep": "210 45% 20%",
    "--emerald": "210 55% 35%",
    "--emerald-light": "210 40% 45%",
    "--cream": "210 30% 97%",
    "--cream-dark": "210 20% 90%",
  },
  royal: {
    "--background": "270 25% 97%",
    "--foreground": "270 20% 15%",
    "--card": "270 20% 95%",
    "--card-foreground": "270 20% 15%",
    "--popover": "270 25% 97%",
    "--popover-foreground": "270 20% 15%",
    "--primary": "270 40% 35%",
    "--primary-foreground": "270 25% 97%",
    "--secondary": "280 35% 85%",
    "--secondary-foreground": "270 20% 15%",
    "--muted": "270 15% 92%",
    "--muted-foreground": "270 10% 45%",
    "--accent": "280 55% 55%",
    "--accent-foreground": "270 20% 15%",
    "--border": "280 20% 85%",
    "--input": "280 20% 85%",
    "--ring": "270 40% 35%",
    "--gold": "280 55% 55%",
    "--gold-light": "280 45% 72%",
    "--emerald-deep": "270 35% 18%",
    "--emerald": "270 40% 35%",
    "--emerald-light": "270 30% 45%",
    "--cream": "270 25% 97%",
    "--cream-dark": "270 15% 90%",
  },
  sunset: {
    "--background": "35 35% 97%",
    "--foreground": "25 25% 15%",
    "--card": "35 30% 95%",
    "--card-foreground": "25 25% 15%",
    "--popover": "35 35% 97%",
    "--popover-foreground": "25 25% 15%",
    "--primary": "25 70% 38%",
    "--primary-foreground": "35 35% 97%",
    "--secondary": "35 50% 85%",
    "--secondary-foreground": "25 25% 15%",
    "--muted": "35 20% 92%",
    "--muted-foreground": "25 12% 45%",
    "--accent": "15 75% 50%",
    "--accent-foreground": "25 25% 15%",
    "--border": "35 30% 85%",
    "--input": "35 30% 85%",
    "--ring": "25 70% 38%",
    "--gold": "15 75% 50%",
    "--gold-light": "25 60% 72%",
    "--emerald-deep": "25 50% 18%",
    "--emerald": "25 70% 38%",
    "--emerald-light": "25 50% 48%",
    "--cream": "35 35% 97%",
    "--cream-dark": "35 25% 90%",
  },
  rose: {
    "--background": "350 30% 97%",
    "--foreground": "345 20% 15%",
    "--card": "350 25% 95%",
    "--card-foreground": "345 20% 15%",
    "--popover": "350 30% 97%",
    "--popover-foreground": "345 20% 15%",
    "--primary": "345 55% 35%",
    "--primary-foreground": "350 30% 97%",
    "--secondary": "350 40% 87%",
    "--secondary-foreground": "345 20% 15%",
    "--muted": "350 15% 92%",
    "--muted-foreground": "345 10% 45%",
    "--accent": "340 60% 50%",
    "--accent-foreground": "345 20% 15%",
    "--border": "350 20% 85%",
    "--input": "350 20% 85%",
    "--ring": "345 55% 35%",
    "--gold": "340 60% 50%",
    "--gold-light": "345 50% 72%",
    "--emerald-deep": "345 40% 18%",
    "--emerald": "345 55% 35%",
    "--emerald-light": "345 35% 45%",
    "--cream": "350 30% 97%",
    "--cream-dark": "350 20% 90%",
  },
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    try {
      return (localStorage.getItem("quran_theme_color") as ThemeColor) || "emerald";
    } catch {
      return "emerald";
    }
  });

  const setTheme = useCallback((t: ThemeColor) => {
    setThemeState(t);
    localStorage.setItem("quran_theme_color", t);
  }, []);

  // Apply theme vars to :root for global coverage (including portals)
  useEffect(() => {
    const root = document.documentElement;
    const vars = THEME_VARS[theme];
    // Clear all theme vars first
    const allVarKeys = new Set<string>();
    Object.values(THEME_VARS).forEach((v) => Object.keys(v).forEach((k) => allVarKeys.add(k)));
    allVarKeys.forEach((key) => root.style.removeProperty(key));
    // Apply current theme vars
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  const themeStyle = useMemo(() => {
    const vars = THEME_VARS[theme];
    if (Object.keys(vars).length === 0) return undefined;
    return vars as React.CSSProperties;
  }, [theme]);

  return { theme, setTheme, themes: THEMES, themeStyle };
};
