/**
 * 根据「自 1970-01-01 以来的 UTC 日数」在 quotes 长度内取模，得到当天稳定的引言下标。
 * 与需求文档一致：同一天内多次刷新索引不变，跨 UTC 日自然切换（类比 Python 里用 date.today() 做随机种子）。
 */
export function getDailyQuoteIndex(quotesLength: number): number {
  if (quotesLength <= 0) {
    return 0;
  }
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  return daysSinceEpoch % quotesLength;
}
