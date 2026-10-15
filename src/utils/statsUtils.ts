import type { DayRecord } from "../types";
import { addCalendarDays } from "./dateUtils";

/**
 * 「打卡」判定：当天留下了用户主动产生的内容——评分、状态、备注、
 * 完成过任务，或手动添加过任务。只有自动结转进来却没动过的任务不算。
 */
export function isCheckinRecord(record: DayRecord | undefined): boolean {
  if (record === undefined) {
    return false;
  }
  return (
    record.rating !== null ||
    record.moodId !== null ||
    record.note.trim() !== "" ||
    record.tasks.some((task) => task.completed || task.carryoverFromTaskId === undefined)
  );
}

/** 全部记录里「打卡日」的最长连续天数。 */
export function computeLongestCheckinStreak(all: Record<string, DayRecord>): number {
  const dates = Object.keys(all)
    .filter((date) => isCheckinRecord(all[date]))
    .sort();

  let best = 0;
  let current = 0;
  let previous: string | null = null;
  for (const date of dates) {
    current = previous !== null && addCalendarDays(previous, 1) === date ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }
  return best;
}

/**
 * 截至今天的当前连续打卡天数。今天还没打卡时从昨天开始算，
 * 这样白天打开应用时不会看到连续记录「断掉」。
 */
export function computeCurrentCheckinStreak(all: Record<string, DayRecord>, today: string): number {
  let cursor = isCheckinRecord(all[today]) ? today : addCalendarDays(today, -1);
  let streak = 0;
  while (isCheckinRecord(all[cursor])) {
    streak += 1;
    cursor = addCalendarDays(cursor, -1);
  }
  return streak;
}

export function countCompleted(record: DayRecord | undefined): number {
  return record?.tasks.filter((task) => task.completed).length ?? 0;
}
