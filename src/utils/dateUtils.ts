/**
 * 日期相关工具：与 DayRecord.date 的 "YYYY-MM-DD" 约定保持一致。
 */

/**
 * 返回今天的日期字符串，格式为 "YYYY-MM-DD"。
 * 使用本地时区的年/月/日（与用户在日历上看到的「今天」一致，不用 UTC 避免跨日偏差）。
 */
export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * 将本地日历的年、月（0 表示一月）、日转为 "YYYY-MM-DD"，用于日历格子与 DayRecord.date 对齐。
 */
export function formatDateString(year: number, monthIndex: number, day: number): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

/**
 * 从本地「今天」起往前共 count 天（含今天），按时间从旧到新排列，每项为 "YYYY-MM-DD"。
 * 用于统计页「最近 N 天」坐标与汇总。
 */
export function getDateStringsEndingTodayInclusive(count: number): string[] {
  if (count < 1) {
    return [];
  }
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const dt = new Date(y, m, d - i);
    out.push(formatDateString(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  }
  return out;
}

/**
 * 将 "YYYY-MM-DD" 转为图表横轴用的短标签，如 "4/7"。
 */
export function formatShortAxisDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    return dateStr;
  }
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) {
    return dateStr;
  }
  return `${month}/${day}`;
}

/** 星期中文：与 Date#getDay() 返回值 0～6 对应（0 = 星期日） */
const WEEKDAY_LABELS: readonly string[] = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
];

/**
 * 把 "YYYY-MM-DD" 转成更易读的中文，例如 "2026年4月7日 星期二"。
 * 月份、日期不补前导零（与常见中文日期写法一致）。
 * 若字符串格式不对或无法构成合法日期，则原样返回入参，避免抛错。
 */
/**
 * 比较两个 "YYYY-MM-DD" 字符串的日历先后顺序（字典序与真实日期序一致）。
 * a 早于 b 返回负数，相等返回 0，a 晚于 b 返回正数。
 */
export function compareDateStrings(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/**
 * 将某 "YYYY-MM-DD" 日期按本地日历加减若干天，仍返回 "YYYY-MM-DD"。
 * 用于计算「昨天」「明天」等，避免手写 Date 时区边界出错。
 */
export function addCalendarDays(dateStr: string, deltaDays: number): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    return dateStr;
  }
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return dateStr;
  }
  const dt = new Date(year, month - 1, day + deltaDays);
  return formatDateString(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/** 返回「昨天」的 "YYYY-MM-DD"（相对本地今天）。 */
export function getYesterdayString(): string {
  return addCalendarDays(getTodayString(), -1);
}

/** 返回「明天」的 "YYYY-MM-DD"（相对本地今天）。 */
export function getTomorrowString(): string {
  return addCalendarDays(getTodayString(), 1);
}

/**
 * 选中日期是否严格早于「昨天」（即前天及更早）。
 * 这些日期允许编辑，但首次编辑前需要用户二次确认（与「昨天」区分）。
 */
export function isStrictlyBeforeYesterday(dateStr: string): boolean {
  return compareDateStrings(dateStr, getYesterdayString()) < 0;
}

/**
 * 选中日期是否晚于今天：未来日可提前规划任务与备注，但不参与当日自评打分。
 */
export function isFutureDateString(dateStr: string): boolean {
  return compareDateStrings(dateStr, getTodayString()) > 0;
}

export function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    return dateStr;
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return dateStr;
  }

  const date = new Date(year, month - 1, day);
  // 校验：避免 "2026-02-30" 等被 Date 自动纠正成别的日期却仍显示错误
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return dateStr;
  }

  const weekday = WEEKDAY_LABELS[date.getDay()];
  return `${year}年${month}月${day}日 ${weekday}`;
}
