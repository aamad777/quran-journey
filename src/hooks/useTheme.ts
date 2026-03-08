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
    const root = document.documentElement;
    // Remove all theme classes from both html and body
    THEMES.forEach((t) => {
      root.classList.remove(`theme-${t.id}`);
      document.body.classList.remove(`theme-${t.id}`);
    });
    // Add current theme class
    if (theme !== "emerald") {
      root.classList.add(`theme-${theme}`);
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return { theme, setTheme, themes: THEMES };
};
