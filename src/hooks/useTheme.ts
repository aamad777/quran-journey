import { useState, useEffect, useCallback } from "react";

export type ThemeColor = "emerald" | "ocean" | "royal" | "sunset" | "rose";

interface ThemeInfo {
  id: ThemeColor;
  label: string;
  labelAr: string;
  preview: string; // primary color for preview dot
}

export const THEMES: ThemeInfo[] = [
  { id: "emerald", label: "Emerald", labelAr: "زمردي", preview: "#2d6a4f" },
  { id: "ocean", label: "Ocean", labelAr: "محيطي", preview: "#1e6091" },
  { id: "royal", label: "Royal", labelAr: "ملكي", preview: "#5b3a8c" },
  { id: "sunset", label: "Sunset", labelAr: "غروب", preview: "#b45309" },
  { id: "rose", label: "Rose", labelAr: "وردي", preview: "#9f1239" },
];

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

  useEffect(() => {
    // Apply to multiple targets for maximum compatibility
    const targets = [document.documentElement, document.body, document.getElementById("root")].filter(Boolean) as HTMLElement[];
    targets.forEach((el) => {
      THEMES.forEach((t) => el.classList.remove(`theme-${t.id}`));
      if (theme !== "emerald") {
        el.classList.add(`theme-${theme}`);
      }
    });
  }, [theme]);

  return { theme, setTheme, themes: THEMES };
};
