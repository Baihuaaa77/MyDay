import { type FC } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { type ThemeMode, setThemeMode, useThemeMode } from "../hooks/useTheme";

const ORDER: readonly ThemeMode[] = ["system", "light", "dark"];
const LABELS: Record<ThemeMode, string> = {
  system: "跟随系统",
  light: "浅色模式",
  dark: "深色模式",
};

/** 单按钮循环切换：跟随系统 → 浅色 → 深色 */
const ThemeToggle: FC = () => {
  const mode = useThemeMode();
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      className="icon-btn h-10 w-10 rounded-xl"
      onClick={() => setThemeMode(next)}
      aria-label={`当前：${LABELS[mode]}，点击切换为${LABELS[next]}`}
      title={`${LABELS[mode]}（点击切换）`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
    </button>
  );
};

export default ThemeToggle;
