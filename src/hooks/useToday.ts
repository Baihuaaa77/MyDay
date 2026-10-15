import { useEffect, useState } from "react";
import { getTodayString } from "../utils/dateUtils";

/**
 * 返回本地「今天」，并在跨过零点、或页面重新回到前台时自动更新，
 * 避免应用整夜开着第二天仍停留在旧日期。
 */
export function useToday(): string {
  const [today, setToday] = useState<string>(getTodayString);

  useEffect(() => {
    const refresh = (): void => setToday(getTodayString());
    const interval = window.setInterval(refresh, 30_000);
    const handleVisibility = (): void => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return today;
}
