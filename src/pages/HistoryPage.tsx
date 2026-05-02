import { type FC, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  ListChecks,
  NotebookText,
  Pencil,
  Sparkles,
} from "lucide-react";
import { getAllRecords } from "../data/storage";
import type { DayRecord, Task } from "../types";
import {
  formatDateString,
  formatDisplayDate,
  getTodayString,
  isFutureDateString,
  isStrictlyBeforeYesterday,
} from "../utils/dateUtils";
import { useDayRecordEditor } from "../hooks/useDayRecordEditor";
import StarRating from "../components/StarRating";
import DailyNote from "../components/DailyNote";
import TaskList from "../components/TaskList";
import ConfirmDialog from "../components/ConfirmDialog";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import MoodPicker from "../components/MoodPicker";
import { getMoodById } from "../data/moods";

const WEEKDAY_HEADERS: readonly string[] = ["一", "二", "三", "四", "五", "六", "日"];

function getCalendarDayButtonClass(params: {
  stored: boolean;
  rating: number | null;
  isSelected: boolean;
  isToday: boolean;
}): string {
  const { stored, rating, isSelected, isToday } = params;
  const base =
    "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border p-1 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500";

  if (isSelected) {
    return `${base} z-10 border-teal-600 bg-teal-600 text-white shadow-md ring-2 ring-teal-200`;
  }
  if (!stored) {
    return `${base} border-transparent text-slate-500 hover:bg-slate-100`;
  }

  let heat = "border-slate-200 bg-white shadow-sm hover:bg-slate-50";
  if (rating !== null) {
    if (rating <= 4) {
      heat = "border-rose-100 bg-rose-50 hover:border-rose-200";
    } else if (rating <= 6) {
      heat = "border-amber-100 bg-amber-50 hover:border-amber-200";
    } else if (rating <= 8) {
      heat = "border-teal-100 bg-teal-50 hover:border-teal-200";
    } else {
      heat = "border-teal-200 bg-teal-100 hover:bg-teal-50";
    }
  }

  if (isToday) {
    return `${base} ${heat} ring-1 ring-teal-300`;
  }
  return `${base} ${heat} hover:shadow-sm`;
}

function buildMonthCells(year: number, monthIndex: number): (number | null)[] {
  const first = new Date(year, monthIndex, 1);
  const padStart = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < padStart; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function TaskSummaryList({ tasks }: { tasks: Task[] }): JSX.Element {
  if (tasks.length === 0) {
    return <p className="panel-muted text-sm leading-6 text-slate-500">这一天没有留下任务。</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <li key={task.id} className="soft-list-item flex items-start gap-3 px-4 py-3">
          <span className="mt-0.5 shrink-0" aria-hidden>
            {task.completed ? (
              <Check className="h-5 w-5 text-teal-600" aria-hidden />
            ) : (
              <Circle className="h-5 w-5 text-slate-400" aria-hidden />
            )}
          </span>
          <span
            className={`min-w-0 flex-1 text-base leading-relaxed ${
              task.completed ? "text-slate-400 line-through" : "text-slate-900"
            }`}
          >
            {task.title}
          </span>
        </li>
      ))}
    </ul>
  );
}

const HistoryPage: FC = () => {
  const todayStr = getTodayString();
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => todayStr);
  const [confirmedOldDateEdits, setConfirmedOldDateEdits] = useState<Record<string, boolean>>({});
  const [confirmOldEditOpen, setConfirmOldEditOpen] = useState<boolean>(false);
  const [allRecords, setAllRecords] = useState<Record<string, DayRecord>>({});
  const [dataError, setDataError] = useState<string | null>(null);

  const {
    record,
    addTask,
    toggleTask,
    deleteTask,
    setRating,
    setNote,
    setMood,
  } = useDayRecordEditor(selectedDateStr);

  const year = viewMonth.getFullYear();
  const monthIndex = viewMonth.getMonth();
  const monthTitle = `${year}年${monthIndex + 1}月`;
  const cells = useMemo(() => buildMonthCells(year, monthIndex), [year, monthIndex]);

  useEffect(() => {
    let cancelled = false;

    void getAllRecords()
      .then((records) => {
        if (!cancelled) {
          setAllRecords(records);
          setDataError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataError("读取历史数据失败，请刷新后重试。");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (record !== null) {
      setAllRecords((prev) => ({ ...prev, [record.date]: record }));
    }
  }, [record]);

  const needsOldDateConfirm =
    selectedDateStr !== null &&
    isStrictlyBeforeYesterday(selectedDateStr) &&
    confirmedOldDateEdits[selectedDateStr] !== true;

  const displayRecord = record;
  const isSelectedFuture =
    selectedDateStr !== null && isFutureDateString(selectedDateStr);
  const taskTotal = displayRecord?.tasks.length ?? 0;
  const taskCompleted = displayRecord?.tasks.filter((t) => t.completed).length ?? 0;
  const canEditSelectedDate = selectedDateStr !== null && !needsOldDateConfirm;

  const handlePrevMonth = (): void => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = (): void => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDateStr(null);
  };

  const handlePickDay = (day: number): void => {
    setSelectedDateStr(formatDateString(year, monthIndex, day));
  };

  const handleConfirmOldEdit = (): void => {
    if (selectedDateStr !== null) {
      setConfirmedOldDateEdits((prev) => ({ ...prev, [selectedDateStr]: true }));
    }
    setConfirmOldEditOpen(false);
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="icon-tile">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="eyebrow">Timeline archive</p>
              <h1 className="page-title">历史记录</h1>
            </div>
          </div>
          <QuoteOfTheDay variant="history" className="mt-3 max-w-3xl" />
          {dataError !== null && (
            <p className="mt-3 text-sm font-medium text-rose-600">{dataError}</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          {monthTitle}
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-8">
        <section className="panel panel-glow-cool panel-interactive lg:sticky lg:top-20 lg:col-span-2 lg:self-start">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="icon-button"
              aria-label="上一个月"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <h2 className="section-title">{monthTitle}</h2>
            <button
              type="button"
              onClick={handleNextMonth}
              className="icon-button"
              aria-label="下一个月"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-400">
            {WEEKDAY_HEADERS.map((label) => (
              <div key={label} className="py-2">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="min-h-14" aria-hidden />;
              }

              const dateStr = formatDateString(year, monthIndex, day);
              const stored = dateStr in allRecords;
              const rec = stored ? allRecords[dateStr] : undefined;
              const rating = rec?.rating ?? null;
              const moodOption = rec?.moodId ? getMoodById(rec.moodId) : undefined;
              const isToday = dateStr === todayStr;
              const isSelected = selectedDateStr === dateStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handlePickDay(day)}
                  className={getCalendarDayButtonClass({
                    stored,
                    rating,
                    isSelected,
                    isToday,
                  })}
                  aria-label={`${dateStr}，${stored ? "有记录" : "无记录"}`}
                  aria-pressed={isSelected}
                >
                  <span className={`font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {day}
                  </span>
                  {stored && moodOption ? (
                    <span className="text-base leading-none" aria-hidden title={moodOption.label}>
                      {moodOption.emoji}
                    </span>
                  ) : stored ? (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-teal-500"
                      aria-hidden
                      title="有记录"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <div className="min-w-0 lg:col-span-3">
          {selectedDateStr === null ? (
            <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-teal-500 shadow-inner">
                <CalendarRange className="h-8 w-8" strokeWidth={1.25} aria-hidden />
              </div>
              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">
                在日历里选择一天，查看这一天的状态评分、待办任务和记录。
              </p>
            </div>
          ) : displayRecord ? (
            <section className="space-y-6">
              <div className="panel">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-950">
                      {formatDisplayDate(selectedDateStr)}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedDateStr in allRecords
                        ? `已完成 ${taskCompleted} / ${taskTotal} 项任务`
                        : "这一天还没有保存过内容。"}
                    </p>
                  </div>
                  {needsOldDateConfirm && (
                    <button
                      type="button"
                      onClick={() => setConfirmOldEditOpen(true)}
                      className="btn-primary px-4 py-2"
                    >
                      <Pencil className="h-5 w-5 shrink-0" aria-hidden />
                      编辑此日记录
                    </button>
                  )}
                </div>
              </div>

              <section className="panel panel-glow panel-interactive overflow-visible">
                <div className="flex items-start gap-3">
                  <div className="icon-tile">
                    <Sparkles className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="section-title">状态与评分</h3>
                    <p className="section-copy">
                      一眼查看这一天的状态，也能在这里调整评分。
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)]">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">状态</h4>
                    <div className="mt-3">
                      <MoodPicker
                        value={displayRecord.moodId}
                        onChange={canEditSelectedDate ? setMood : undefined}
                        readOnly={!canEditSelectedDate}
                        emptyLabel="选一个代表这一天的状态吧"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">自评</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {isSelectedFuture
                        ? "未来日期暂不评分，到当天后再填写。"
                        : canEditSelectedDate
                          ? "点击星星选择分数，可随时修改。"
                          : "这一天的评分现在处于只读状态。"}
                    </p>
                    <div className="mt-3 overflow-x-auto pb-1">
                      {isSelectedFuture ? (
                        <StarRating value={null} readOnly />
                      ) : (
                        <StarRating
                          value={displayRecord.rating}
                          onChange={canEditSelectedDate ? setRating : undefined}
                          readOnly={!canEditSelectedDate}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <section className="panel panel-glow-cool panel-interactive h-full">
                  <div className="flex items-start gap-3">
                    <div className="icon-tile">
                      <ListChecks className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="section-title">待办任务</h3>
                      <p className="section-copy">
                        {canEditSelectedDate
                          ? "补充任务，或更新完成情况。"
                          : `已完成 ${taskCompleted} / ${taskTotal} 项。`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    {canEditSelectedDate ? (
                      <TaskList
                        tasks={displayRecord.tasks}
                        onAddTask={addTask}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}
                        emptyText="这一天还没有任务。可以补充一个当时的待办或结果。"
                      />
                    ) : (
                      <TaskSummaryList tasks={displayRecord.tasks} />
                    )}
                  </div>
                </section>

                <section className="panel panel-glow-warm panel-interactive h-full">
                  <div className="flex items-start gap-3">
                    <div className="icon-tile">
                      <NotebookText className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="section-title">当日记录</h3>
                      <p className="section-copy">
                        {canEditSelectedDate
                          ? "沉淀这一天的关键进展、感受或复盘。"
                          : "这一天的记录当前只读。"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <DailyNote
                      value={displayRecord.note}
                      onChange={canEditSelectedDate ? setNote : undefined}
                      readOnly={!canEditSelectedDate}
                      placeholder="写下这一天想留下的内容"
                      ariaLabel="当日记录"
                    />
                  </div>
                </section>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOldEditOpen}
        title="确认编辑"
        message="确定要修改这一天的记录吗？"
        confirmLabel="确定"
        cancelLabel="取消"
        onConfirm={handleConfirmOldEdit}
        onCancel={() => setConfirmOldEditOpen(false)}
      />
    </main>
  );
};

export default HistoryPage;
