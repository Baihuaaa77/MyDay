import type { DayRecord } from "../types";

/**
 * 「打卡」判定：当天记录里至少有一项实质内容（任务、评分或备注），
 * 用于计算最长连续打卡天数。
 */
export function isCheckinRecord(record: DayRecord): boolean {
  return (
    record.tasks.length > 0 ||
    record.rating !== null ||
    record.note.trim() !== ""
  );
}

/**
 * 判断 next 是否为 prev 的日历下一天（按本地时区解析 YYYY-MM-DD）。
 */
function isConsecutiveCalendarDays(prev: string, next: string): boolean {
  const [y1, m1, d1] = prev.split("-").map(Number);
  const [y2, m2, d2] = next.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1);
  const b = new Date(y2, m2 - 1, d2);
  const diffMs = b.getTime() - a.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  return diffDays === 1;
}

/**
 * 在所有本地记录中，计算「打卡日」最长连续日历天数（全局，不限最近 30 天）。
 * 若无任何打卡日，返回 0；单日打卡返回 1。
 */
export function computeLongestCheckinStreak(all: Record<string, DayRecord>): number {
  const dates = Object.keys(all).filter((ds) => {
    const r = all[ds];
    return r !== undefined && isCheckinRecord(r);
  });
  if (dates.length === 0) {
    return 0;
  }
  dates.sort();
  let best = 1;
  let cur = 1;
  for (let i = 1; i < dates.length; i++) {
    if (isConsecutiveCalendarDays(dates[i - 1], dates[i])) {
      cur += 1;
    } else {
      cur = 1;
    }
    if (cur > best) {
      best = cur;
    }
  }
  return best;
}
