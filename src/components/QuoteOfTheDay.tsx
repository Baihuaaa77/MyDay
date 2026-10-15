import { type FC } from "react";
import { historyQuotes, presentQuotes, statsQuotes } from "../data/quotes";
import type { QuoteEntry } from "../types";
import { getDailyQuoteIndex } from "../utils/quoteUtils";

export interface QuoteOfTheDayProps {
  variant: "present" | "history" | "stats";
  /** 用于按日轮换的日期；默认今天 */
  date?: string;
  className?: string;
}

const QUOTES: Record<QuoteOfTheDayProps["variant"], readonly QuoteEntry[]> = {
  present: presentQuotes,
  history: historyQuotes,
  stats: statsQuotes,
};

/** 页头引言：按日固定一句，次日自动更换。 */
const QuoteOfTheDay: FC<QuoteOfTheDayProps> = ({ variant, date, className }) => {
  const quotes = QUOTES[variant];
  const entry = quotes[getDailyQuoteIndex(quotes.length, date)];

  return (
    <figure className={`min-w-0 text-sm leading-6 text-ink-2 ${className ?? ""}`}>
      <blockquote className="inline">“{entry.text}”</blockquote>
      <figcaption className="ml-2 inline whitespace-nowrap text-ink-3">— {entry.author}</figcaption>
    </figure>
  );
};

export default QuoteOfTheDay;
