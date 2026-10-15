import {
  type FC,
  type KeyboardEvent,
  type TouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Search,
  SearchX,
  Unlock,
  X,
} from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import DayEditor from "../components/DayEditor";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import { getMoodById } from "../data/moods";
import { hasRecordContent } from "../data/storage";
import { useAllRecords } from "../hooks/useAllRecords";
import { useDayRecordEditor } from "../hooks/useDayRecordEditor";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useToday } from "../hooks/useToday";
import type { DayRecord } from "../types";
import {
  addCalendarDays,
  compareDateStrings,
  formatDateString,
  formatDisplayDate,
  formatMonthDay,
  getRelativeDayLabel,
  isStrictlyBeforeYesterday,
  parseDateString,
} from "../utils/dateUtils";
import { countCompleted } from "../utils/statsUtils";

const WEEKDAY_HEADERS: readonly string[] = ["一", "二", "三", "四", "五", "六", "日"];

interface MonthCursor {
  year: number;
  month: number;
}

interface CalendarCell {
  date: string;
  day: number;
  inMonth: boolean;
}

function monthOf(date: string): MonthCursor {
  const parsed = parseDateString(date) ?? new Date();
  return { year: parsed.getFullYear(), month: parsed.getMonth() };
}

function shiftMonth(cursor: MonthCursor, delta: number): MonthCursor {
  const date = new Date(cursor.year, cursor.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** 周一开头的 6×7 或 5×7 月历，首尾补齐相邻月份的日期 */
function buildMonthCells({ year, month }: MonthCursor): CalendarCell[] {
  const first = new Date(year, month, 1);
  const padStart = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((padStart + daysInMonth) / 7) * 7;
  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month, 1 - padStart + i);
    cells.push({
      date: formatDateString(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    });
  }
  return cells;
}

function getHeatClass(rating: number | null): string {
  if (rating === null) {
    return "bg-surface-2";
  }
  if (rating <= 4) {
    return "bg-danger-soft";
  }
  if (rating <= 6) {
    return "bg-warm-soft";
  }
  if (rating <= 8) {
    return "bg-brand-soft";
  }
  return "bg-brand/25";
}

/* ------------------------------------------------------------------ */
/* 搜索                                                                */
/* ------------------------------------------------------------------ */

interface SearchHit {
  date: string;
  snippet: string;
  matchStart: number;
  matchLength: number;
}

function searchRecords(records: Record<string, DayRecord>, query: string): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return [];
  }
  const hits: SearchHit[] = [];
  for (const record of Object.values(records)) {
    const sources = [...record.tasks.map((task) => task.title), record.note];
    for (const text of sources) {
      const index = text.toLowerCase().indexOf(needle);
      if (index !== -1) {
        const start = Math.max(0, index - 16);
        const prefix = start > 0 ? "…" : "";
        const snippet = `${prefix}${text.slice(start, index + needle.length + 40).replace(/\s+/g, " ")}`;
        hits.push({
          date: record.date,
          snippet,
          matchStart: prefix.length + (index - start),
          matchLength: needle.length,
        });
        break;
      }
    }
  }
  return hits.sort((a, b) => compareDateStrings(b.date, a.date)).slice(0, 50);
}

const HighlightedSnippet: FC<{ hit: SearchHit }> = ({ hit }) => (
  <span className="text-sm text-ink-2">
    {hit.snippet.slice(0, hit.matchStart)}
    <mark className="rounded bg-warm-soft px-0.5 text-ink">
      {hit.snippet.slice(hit.matchStart, hit.matchStart + hit.matchLength)}
    </mark>
    {hit.snippet.slice(hit.matchStart + hit.matchLength)}
  </span>
);

/* ------------------------------------------------------------------ */
/* 页面                                                                */
/* ------------------------------------------------------------------ */

const HistoryPage: FC = () => {
  const today = useToday();
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [selected, setSelected] = useState<string>(today);
  const [cursor, setCursor] = useState<MonthCursor>(() => monthOf(today));
  const [unlockedDates, setUnlockedDates] = useState<ReadonlySet<string>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { records, error: recordsError } = useAllRecords();
  const editor = useDayRecordEditor(selected);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const focusAfterMoveRef = useRef(false);

  const cells = useMemo(() => buildMonthCells(cursor), [cursor]);
  const hits = useMemo(() => searchRecords(records, query), [records, query]);
  const isCurrentMonth = cursor.year === monthOf(today).year && cursor.month === monthOf(today).month;

  const monthSummary = useMemo(() => {
    let days = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    let completed = 0;
    for (const cell of cells) {
      const record = records[cell.date];
      if (!cell.inMonth || !hasRecordContent(record) || record === undefined) {
        continue;
      }
      days += 1;
      completed += countCompleted(record);
      if (record.rating !== null) {
        ratingSum += record.rating;
        ratingCount += 1;
      }
    }
    return {
      days,
      completed,
      average: ratingCount === 0 ? null : Math.round((ratingSum / ratingCount) * 10) / 10,
    };
  }, [cells, records]);

  const locked = isStrictlyBeforeYesterday(selected) && !unlockedDates.has(selected);

  useEffect(() => {
    if (focusAfterMoveRef.current) {
      focusAfterMoveRef.current = false;
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${selected}"]`)?.focus();
    }
  }, [selected, cells]);

  const selectDate = (date: string, options: { scroll?: boolean } = {}): void => {
    setSelected(date);
    const target = monthOf(date);
    if (target.year !== cursor.year || target.month !== cursor.month) {
      setCursor(target);
    }
    if (options.scroll === true && !isWide) {
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const goToToday = (): void => {
    setQuery("");
    selectDate(today);
  };

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const delta = deltas[event.key];
    if (delta === undefined) {
      return;
    }
    event.preventDefault();
    focusAfterMoveRef.current = true;
    selectDate(addCalendarDays(selected, delta));
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>): void => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>): void => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = event.changedTouches[0];
    if (start === null || touch === undefined) {
      return;
    }
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      setCursor((value) => shiftMonth(value, dx < 0 ? 1 : -1));
    }
  };

  const selectedRecord = records[selected];
  const relative = getRelativeDayLabel(selected, today);

  return (
    <main className="page page-enter">
      <header className="mb-5 flex flex-col gap-4 lg:mb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">回顾</p>
          <h1 className="mt-1.5 text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-[2rem]">
            历史记录
          </h1>
          <QuoteOfTheDay variant="history" date={today} className="mt-2 max-w-2xl" />
        </div>
        <label className="group relative block w-full lg:w-80">
          <span className="sr-only">搜索任务或记录</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3 group-focus-within:text-brand"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setQuery("")}
            placeholder="搜索任务或记录…"
            className="input h-11 pl-10 pr-10"
          />
          {query !== "" ? (
            <button
              type="button"
              className="icon-btn absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => setQuery("")}
              aria-label="清空搜索"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </label>
      </header>

      {recordsError !== null ? (
        <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert">
          {recordsError}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* 左栏：搜索结果或月历 */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          {query.trim() !== "" ? (
            <section className="card" aria-label="搜索结果">
              <p className="mb-3 text-sm font-semibold text-ink-2">
                找到 <span className="text-ink">{hits.length}</span> 天
              </p>
              {hits.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-ink-3">
                  <SearchX className="h-8 w-8" strokeWidth={1.5} aria-hidden />
                  <p className="text-sm">没有找到包含「{query.trim()}」的记录</p>
                </div>
              ) : (
                <ul className="-mx-2 flex max-h-[60vh] flex-col overflow-y-auto">
                  {hits.map((hit) => (
                    <li key={hit.date}>
                      <button
                        type="button"
                        className={`flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2 ${
                          hit.date === selected ? "bg-brand-soft/60" : ""
                        }`}
                        onClick={() => selectDate(hit.date, { scroll: true })}
                      >
                        <span className="text-xs font-semibold text-ink">
                          {formatMonthDay(hit.date)}
                          <span className="ml-2 font-normal text-ink-3">{hit.date.slice(0, 4)}</span>
                        </span>
                        <HighlightedSnippet hit={hit} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <section className="card" aria-label="月历">
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setCursor((value) => shiftMonth(value, -1))}
                  aria-label="上一个月"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <div className="flex items-center gap-2">
                  <h2 className="tabular text-base font-bold text-ink">
                    {cursor.year}年{cursor.month + 1}月
                  </h2>
                  {!isCurrentMonth || selected !== today ? (
                    <button type="button" className="chip py-0.5" onClick={goToToday}>
                      今天
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setCursor((value) => shiftMonth(value, 1))}
                  aria-label="下一个月"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-ink-3">
                {WEEKDAY_HEADERS.map((label) => (
                  <div key={label} className="py-1.5">
                    {label}
                  </div>
                ))}
              </div>

              <div
                ref={gridRef}
                className="grid grid-cols-7 gap-1"
                role="grid"
                aria-label={`${cursor.year}年${cursor.month + 1}月`}
                data-swipe-lock="true"
                onKeyDown={handleGridKeyDown}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {cells.map((cell) => {
                  const record = records[cell.date];
                  const stored = hasRecordContent(record);
                  const mood = getMoodById(record?.moodId);
                  const isToday = cell.date === today;
                  const isSelected = cell.date === selected;
                  const isFuture = compareDateStrings(cell.date, today) > 0;

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      data-date={cell.date}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => selectDate(cell.date, { scroll: true })}
                      aria-pressed={isSelected}
                      aria-label={`${formatDisplayDate(cell.date)}${stored ? "，有记录" : ""}`}
                      className={`relative flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition-all duration-150 ${
                        isSelected
                          ? "bg-brand font-bold text-brand-ink shadow-brand"
                          : stored
                            ? `${getHeatClass(record?.rating ?? null)} font-semibold text-ink hover:brightness-95`
                            : "text-ink-2 hover:bg-surface-2"
                      } ${!cell.inMonth ? "opacity-35" : ""} ${isFuture && !isSelected ? "text-ink-3" : ""} ${
                        isToday && !isSelected ? "ring-2 ring-inset ring-brand" : ""
                      }`}
                    >
                      <span className="tabular leading-none">{cell.day}</span>
                      {mood !== undefined ? (
                        <span className="text-[13px] leading-none" aria-hidden>
                          {mood.emoji}
                        </span>
                      ) : stored ? (
                        <span
                          className={`h-1 w-1 rounded-full ${isSelected ? "bg-brand-ink" : "bg-ink-3"}`}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line/70 pt-4 text-center">
                <div>
                  <dt className="text-[11px] font-medium text-ink-3">记录天数</dt>
                  <dd className="tabular mt-0.5 text-lg font-bold text-ink">{monthSummary.days}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-ink-3">平均评分</dt>
                  <dd className="tabular mt-0.5 text-lg font-bold text-ink">
                    {monthSummary.average ?? "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-ink-3">完成任务</dt>
                  <dd className="tabular mt-0.5 text-lg font-bold text-ink">{monthSummary.completed}</dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-ink-3">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-danger-soft" aria-hidden />
                  ≤4
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-warm-soft" aria-hidden />
                  5–6
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand-soft" aria-hidden />
                  7–8
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand/25" aria-hidden />
                  9–10
                </span>
                <span className="hidden sm:inline">· 左右滑动切换月份</span>
              </div>
            </section>
          )}
        </div>

        {/* 右栏：选中日期详情 */}
        <div ref={detailRef} className="flex min-w-0 scroll-mt-20 flex-col gap-4">
          <section className="card flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-ink sm:text-xl">{formatDisplayDate(selected)}</h2>
                <span className="badge bg-surface-3 text-ink-2">{relative}</span>
              </div>
              <p className="mt-1 text-sm text-ink-2">
                {hasRecordContent(selectedRecord) && selectedRecord !== undefined
                  ? selectedRecord.tasks.length > 0
                    ? `完成 ${countCompleted(selectedRecord)} / ${selectedRecord.tasks.length} 项任务`
                    : "这一天有记录，但没有任务"
                  : "这一天还没有内容"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="icon-btn-bordered"
                onClick={() => selectDate(addCalendarDays(selected, -1))}
                aria-label="前一天"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className="icon-btn-bordered"
                onClick={() => selectDate(addCalendarDays(selected, 1))}
                aria-label="后一天"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {isStrictlyBeforeYesterday(selected) ? (
              <div
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  locked ? "bg-surface-2 text-ink-2" : "bg-brand-soft/60 text-brand-strong"
                }`}
              >
                {locked ? (
                  <Lock className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <Unlock className="h-4 w-4 shrink-0" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  {locked ? "较早的记录默认只读，避免误改。" : "已解锁，修改会直接保存。"}
                </span>
                {locked ? (
                  <button type="button" className="btn-secondary min-h-8 px-3 text-xs" onClick={() => setConfirmOpen(true)}>
                    解锁编辑
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>

          <DayEditor date={selected} today={today} editor={editor} readOnly={locked} compact />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="编辑较早的记录？"
        message={`你将修改 ${formatDisplayDate(selected)} 的记录。修改会直接覆盖当天保存的内容。`}
        confirmLabel="解锁编辑"
        onConfirm={() => {
          setUnlockedDates((prev) => new Set(prev).add(selected));
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
};

export default HistoryPage;
