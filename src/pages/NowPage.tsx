import { type FC, useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "lucide-react";
import DayEditor from "../components/DayEditor";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import { useAllRecords } from "../hooks/useAllRecords";
import { useDayRecordEditor } from "../hooks/useDayRecordEditor";
import { useToday } from "../hooks/useToday";
import { addCalendarDays, formatMonthDay, getGreeting } from "../utils/dateUtils";
import { computeCurrentCheckinStreak } from "../utils/statsUtils";

type Offset = -1 | 0 | 1;

const FOCUS_OPTIONS: readonly { offset: Offset; label: string }[] = [
  { offset: -1, label: "昨天" },
  { offset: 0, label: "今天" },
  { offset: 1, label: "明天" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

const NowPage: FC = () => {
  const today = useToday();
  const [offset, setOffset] = useState<Offset>(0);
  const date = addCalendarDays(today, offset);
  const editor = useDayRecordEditor(date);
  const { records } = useAllRecords();
  const taskInputRef = useRef<HTMLInputElement | null>(null);

  const streak = useMemo(() => computeCurrentCheckinStreak(records, today), [records, today]);

  // 桌面快捷键：N 新建任务，← / → 切换昨天、今天、明天
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target) || document.querySelector("[aria-modal='true']") !== null) {
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        taskInputRef.current?.focus();
      } else if (event.key === "ArrowLeft") {
        setOffset((value) => (value > -1 ? ((value - 1) as Offset) : value));
      } else if (event.key === "ArrowRight") {
        setOffset((value) => (value < 1 ? ((value + 1) as Offset) : value));
      } else if (event.key === "t" || event.key === "T") {
        setOffset(0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const heading =
    offset === 0 ? getGreeting() : offset === -1 ? "回顾昨天" : "规划明天";

  return (
    <main className="page page-enter">
      <header className="mb-5 flex flex-col gap-4 lg:mb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">{heading}</p>
            {streak > 0 ? (
              <span
                className="badge bg-warm-soft text-warm"
                title="连续记录的天数：有评分、状态、备注或完成任务即算一天"
              >
                <Flame className="h-3 w-3" aria-hidden />
                连续 {streak} 天
              </span>
            ) : null}
          </div>
          <h1 className="mt-1.5 text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-[2rem]">
            {formatMonthDay(date)}
          </h1>
          <QuoteOfTheDay variant="present" date={today} className="mt-2 max-w-2xl" />
        </div>

        <div className="segmented w-full shrink-0 lg:w-72" role="tablist" aria-label="选择日期">
          {FOCUS_OPTIONS.map((option) => (
            <button
              key={option.offset}
              type="button"
              role="tab"
              aria-selected={offset === option.offset}
              className="segmented-item"
              onClick={() => setOffset(option.offset)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {editor.error !== null ? (
        <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert">
          {editor.error}
        </p>
      ) : null}

      <DayEditor date={date} today={today} editor={editor} taskInputRef={taskInputRef} />

      <p className="mt-8 hidden items-center justify-center gap-3 text-xs text-ink-3 lg:flex">
        <span>
          <kbd className="kbd">N</kbd> 新建任务
        </span>
        <span>
          <kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> 切换日期
        </span>
        <span>
          <kbd className="kbd">T</kbd> 回到今天
        </span>
      </p>
    </main>
  );
};

export default NowPage;
