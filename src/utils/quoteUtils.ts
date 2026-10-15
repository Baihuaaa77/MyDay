import { getLocalDayNumber } from "./dateUtils";

/**
 * 按本地日历日在 quotes 长度内取模，得到当天稳定的引言下标：
 * 同一天内多次刷新不变，过了本地零点自然切换。
 */
export function getDailyQuoteIndex(quotesLength: number, date?: string): number {
  if (quotesLength <= 0) {
    return 0;
  }
  return getLocalDayNumber(date) % quotesLength;
}
