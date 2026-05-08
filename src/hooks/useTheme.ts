import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

function getSystemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const isDark = mode === "dark" || (mode === "system" && getSystemPrefersDark());
  root.classList.toggle("dark", isDark);
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });

  useEffect(() => {
    applyTheme(mode);
    try { localStorage.setItem("theme", mode); } catch {}
  }, [mode]);

  // Live-update when system preference changes (only matters in "system" mode)
  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggleTheme = useCallback(() => {
    setModeState(prev => (prev === "dark" ? "light" : "dark"));
  }, []);

  // Effective theme (resolves "system")
  const isDark =
    mode === "dark" || (mode === "system" && getSystemPrefersDark());

  return { mode, isDark, setMode, toggleTheme, theme: isDark ? "dark" : "light" as const };
}
