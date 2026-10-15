import { useSyncExternalStore } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const THEME_KEY = "myday-theme";
const THEME_COLORS: Record<ResolvedTheme, string> = { light: "#f4f7f9", dark: "#0b1117" };
const listeners = new Set<() => void>();
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function readMode(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

let mode: ThemeMode = readMode();

function resolve(current: ThemeMode): ResolvedTheme {
  if (current === "system") {
    return systemDark.matches ? "dark" : "light";
  }
  return current;
}

function apply(): void {
  const resolved = resolve(mode);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLORS[resolved]));
  listeners.forEach((listener) => listener());
}

systemDark.addEventListener("change", () => {
  if (mode === "system") {
    apply();
  }
});
apply();

export function setThemeMode(next: ThemeMode): void {
  mode = next;
  try {
    if (next === "system") {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, next);
    }
  } catch {
    // 忽略不可写的存储
  }
  apply();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, () => mode);
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, () => resolve(mode));
}
