/**
 * 日期相关工具：与 DayRecord.date 的 "YYYY-MM-DD" 约定保持一致。
 * 所有计算都基于本地时区的日历日，避免 UTC 带来的跨日偏差。
 */

const DAY_MS = 86400000;
const pad = (n: number): string => String(n).padStart(2, "0");

/** 将本地日历的年、月（0 表示一月）、日转为 "YYYY-MM-DD"。 */
export function formatDateString(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

/** Date 对象 → 本地日历的 "YYYY-MM-DD"。 */
export function toDateString(date: Date): string {
  return formatDateString(date.getFullYear(), date.getMonth(), date.getDate());
}

/** 返回今天的日期字符串（本地时区）。 */
export function getTodayString(): string {
  return toDateString(new Date());
}

/**
 * 解析 "YYYY-MM-DD" 为本地零点的 Date；格式不对或日期不存在（如 2026-02-30）时返回 null。
 */
export function parseDateString(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** 将某日期按本地日历加减若干天。 */
export function addCalendarDays(dateStr: string, deltaDays: number): string {
  const date = parseDateString(dateStr);
  if (date === null) {
    return dateStr;
  }
  date.setDate(date.getDate() + deltaDays);
  return toDateString(date);
}

/** b 比 a 晚多少个日历日（可为负）。 */
export function diffCalendarDays(a: string, b: string): number {
  const da = parseDateString(a);
  const db = parseDateString(b);
  if (da === null || db === null) {
    return 0;
  }
  return Math.round((db.getTime() - da.getTime()) / DAY_MS);
}

/** 从 endDate 起往前共 count 天（含 endDate），按时间从旧到新排列。 */
export function getDateStringsEnding(endDate: string, count: number): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(addCalendarDays(endDate, -i));
  }
  return out;
}

/** 比较两个 "YYYY-MM-DD"（字典序与日期序一致）。 */
export function compareDateStrings(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

export function getYesterdayString(): string {
  return addCalendarDays(getTodayString(), -1);
}

export function getTomorrowString(): string {
  return addCalendarDays(getTodayString(), 1);
}

/** 前天及更早的日期：允许编辑，但首次编辑前需要二次确认。 */
export function isStrictlyBeforeYesterday(dateStr: string): boolean {
  return compareDateStrings(dateStr, getYesterdayString()) < 0;
}

/** 晚于今天的日期：可提前规划，但不参与自评打分。 */
export function isFutureDateString(dateStr: string): boolean {
  return compareDateStrings(dateStr, getTodayString()) > 0;
}

/** 本地日历「自 1970-01-01 以来的天数」，用于按日轮换的内容。 */
export function getLocalDayNumber(dateStr: string = getTodayString()): number {
  const date = parseDateString(dateStr);
  if (date === null) {
    return 0;
  }
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

const WEEKDAY_LABELS: readonly string[] = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const WEEKDAY_FULL_LABELS: readonly string[] = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

export function getWeekdayLabel(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date === null ? "" : WEEKDAY_LABELS[date.getDay()];
}

/** "4/7"：图表横轴短标签。 */
export function formatShortAxisDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date === null ? dateStr : `${date.getMonth() + 1}/${date.getDate()}`;
}

/** "4月7日 周二" */
export function formatMonthDay(dateStr: string, withWeekday = true): string {
  const date = parseDateString(dateStr);
  if (date === null) {
    return dateStr;
  }
  const base = `${date.getMonth() + 1}月${date.getDate()}日`;
  return withWeekday ? `${base} ${WEEKDAY_LABELS[date.getDay()]}` : base;
}

/** "2026年4月7日 星期二"；格式不对时原样返回。 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  if (date === null) {
    return dateStr;
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${
    WEEKDAY_FULL_LABELS[date.getDay()]
  }`;
}

/** 相对今天的口语化标签：今天 / 昨天 / 明天 / 3 天前 / 5 天后。 */
export function getRelativeDayLabel(dateStr: string, today: string = getTodayString()): string {
  const delta = diffCalendarDays(today, dateStr);
  switch (delta) {
    case 0:
      return "今天";
    case -1:
      return "昨天";
    case 1:
      return "明天";
    case -2:
      return "前天";
    case 2:
      return "后天";
    default:
      return delta < 0 ? `${-delta} 天前` : `${delta} 天后`;
  }
}

/** 按当前时刻返回问候语。 */
export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) {
    return "夜深了";
  }
  if (hour < 11) {
    return "早上好";
  }
  if (hour < 13) {
    return "中午好";
  }
  if (hour < 18) {
    return "下午好";
  }
  return "晚上好";
}
