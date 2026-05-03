import { type FC, useMemo } from "react";
import type { QuoteEntry } from "../types";
import { presentQuotes, historyQuotes, statsQuotes } from "../data/quotes";
import { getDailyQuoteIndex } from "../utils/quoteUtils";

/** QuoteOfTheDay 的入参：按页面选择引言池；className 用于外边距与最大宽度（替代原说明段落样式） */
export interface QuoteOfTheDayProps {
  variant: "present" | "history" | "stats";
  className?: string;
}

function getQuotesForVariant(variant: QuoteOfTheDayProps["variant"]): readonly QuoteEntry[] {
  if (variant === "present") {
    return presentQuotes;
  }
  if (variant === "history") {
    return historyQuotes;
  }
  return statsQuotes;
}

/**
 * 页头引言：按日固定一句；无卡片边框、无图标，正文与署名同一斜体字号，直双引号包裹正文。
 */
const QuoteOfTheDay: FC<QuoteOfTheDayProps> = ({ variant, className }) => {
  const quotes = getQuotesForVariant(variant);

  const entry = useMemo(() => {
    const index = getDailyQuoteIndex(quotes.length);
    return quotes[index];
  }, [quotes]);

  const aria =
    variant === "present" ? "当下页每日引言" : variant === "history" ? "历史页每日引言" : "统计页每日引言";

  return (
    <p
      className={`min-w-0 break-words text-sm leading-6 text-slate-500 md:text-base ${className ?? ""}`}
      aria-label={aria}
    >
      {`"${entry.text}"`}
      {/* 与正文末尾引号拉开一点；署名前用短横线，不用长破折号 */}
      <span className="ml-3">- {entry.author}</span>
    </p>
  );
};

export default QuoteOfTheDay;
