import { type FC, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Pencil,
} from "lucide-react";
import { getAllRecords } from "../data/storage";
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

/** 日历表头：周一到周日（与格子生成逻辑对齐） */
const WEEKDAY_HEADERS: readonly string[] = ["一", "二", "三", "四", "五", "六", "日"];

/**
 * 月历单日按钮样式：有记录时用浅白/浅蓝底 + 边框区分评分档，避免高饱和色块显脏；选中日单独强调。
 */
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

  // 有记录：用低饱和色阶表达评分档位，避免高饱和色块显脏。
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

/**
 * 生成某月日历网格：前置空位 + 当月日期 + 末尾补空，使每行 7 格。
 */
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

/**
 * 历史页：月历点选某日；可编辑任务与总结。
 * - 未来日：可提前规划任务与备注，不能打分（保存时 rating 恒为 null）。
 * - 今天、昨天：可直接编辑与打分。
 * - 前天及更早：首次进入编辑前弹出确认（避免误改久远记录）。
 * 宽屏(lg)下日历在左、详情在右并排展示，日历 sticky 固定。
 */
const HistoryPage: FC = () => {
  const todayStr = getTodayString();

  /** 当前查看的月份（始终为该月 1 日 0 时） */
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => todayStr);

  /**
   * 当前选中日在会话内是否已通过「编辑久远日」确认（仅 isStrictlyBeforeYesterday 的日期需要）。
   * 键为 "YYYY-MM-DD"，值为 true 表示本标签页会话内已确认，可展示完整编辑区。
   */
  const [confirmedOldDateEdits, setConfirmedOldDateEdits] = useState<
    Record<string, boolean>
  >({});

  /** 久远日「开始编辑」前的确认弹层是否打开 */
  const [confirmOldEditOpen, setConfirmOldEditOpen] = useState<boolean>(false);

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

  const allRecords = getAllRecords();

  /** 当前选中日是否为「前天及更早」且尚未在本会话中确认编辑 */
  const needsOldDateConfirm: boolean =
    selectedDateStr !== null &&
    isStrictlyBeforeYesterday(selectedDateStr) &&
    confirmedOldDateEdits[selectedDateStr] !== true;

  const handlePrevMonth = (): void => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = (): void => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDateStr(null);
  };

  const handlePickDay = (day: number): void => {
    const dateStr = formatDateString(year, monthIndex, day);
    setSelectedDateStr(dateStr);
  };

  const handleOpenOldEditConfirm = (): void => {
    setConfirmOldEditOpen(true);
  };

  const handleConfirmOldEdit = (): void => {
    if (selectedDateStr !== null) {
      setConfirmedOldDateEdits((prev) => ({ ...prev, [selectedDateStr]: true }));
    }
    setConfirmOldEditOpen(false);
  };

  const handleCancelOldEdit = (): void => {
    setConfirmOldEditOpen(false);
  };

  const displayRecord = record;
  const taskTotal = displayRecord?.tasks.length ?? 0;
  const taskCompleted =
    displayRecord?.tasks.filter((t) => t.completed).length ?? 0;

  const isSelectedFuture =
    selectedDateStr !== null && isFutureDateString(selectedDateStr);

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
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          {monthTitle}
        </div>
      </header>

      {/* 宽屏 5 列：日历 2 列、详情 3 列，详情区更宽以便自评星星单行 */}
      <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-8">
        {/* ─── 日历卡片 ─── */}
        <section className="panel panel-interactive lg:sticky lg:top-20 lg:col-span-2 lg:self-start">
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
                  <span className={`font-semibold ${isSelected ? "text-white" : "text-slate-900"}`}>{day}</span>
                  {stored && moodOption ? (
                    <span
                      className="text-base leading-none"
                      aria-hidden
                      title={moodOption.label}
                    >
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

        {/* ─── 详情面板 ─── */}
        <div className="min-w-0 lg:col-span-3">
          {selectedDateStr === null ? (
            <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-teal-500 shadow-inner">
                <CalendarRange className="h-8 w-8" strokeWidth={1.25} aria-hidden />
              </div>
              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">
                请在日历中点击任意一天，查看或编辑该日的任务、完成情况和今日记录。
              </p>
            </div>
          ) : displayRecord ? (
            <section className="panel space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    {formatDisplayDate(selectedDateStr)}
                  </h2>
                  {selectedDateStr in allRecords ? (
                    <p className="mt-2 text-sm text-slate-500">已同步到本地的记录</p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      该日尚未保存过数据；编辑并保存后会出现蓝色小点标记。
                    </p>
                  )}
                </div>
                {needsOldDateConfirm && (
                  <button
                    type="button"
                    onClick={handleOpenOldEditConfirm}
                    className="btn-primary px-4 py-2"
                  >
                    <Pencil className="h-5 w-5 shrink-0" aria-hidden />
                    编辑此日记录
                  </button>
                )}
              </div>

              {needsOldDateConfirm ? (
                <>
                  {/* 只读模式下展示当日 emoji */}
                  <div className="space-y-4">
                    <h3 className="section-title">当日状态</h3>
                    <MoodPicker value={displayRecord.moodId} readOnly />
                  </div>

                  <div className="space-y-4">
                    <h3 className="section-title">任务与完成情况</h3>
                    {taskTotal === 0 ? (
                      <p className="text-base text-slate-500">当天没有任务。</p>
                    ) : (
                      <>
                        <p className="text-base text-slate-700">
                          已完成{" "}
                          <span className="font-semibold text-teal-600">{taskCompleted}</span>{" "}
                          / 共 <span className="font-semibold text-slate-950">{taskTotal}</span>{" "}
                          项
                        </p>
                        <ul className="space-y-3">
                          {displayRecord.tasks.map((task) => (
                            <li
                              key={task.id}
                              className="soft-list-item flex items-start gap-3 px-4 py-3 text-slate-900"
                            >
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
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="section-title">自评（1～10 分）</h3>
                    {displayRecord.rating === null ? (
                      <p className="text-base text-slate-500">当天未评分。</p>
                    ) : (
                      <StarRating value={displayRecord.rating} readOnly />
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="section-title">今日记录</h3>
                    <p className="text-sm text-slate-500">以下为备注内容（只读）；点上方按钮可编辑。</p>
                    <DailyNote value={displayRecord.note} readOnly />
                  </div>
                </>
              ) : (
                <>
                  {/* 编辑模式下的 emoji 选择器 */}
                  <div className="space-y-4">
                    <h3 className="section-title">当日状态</h3>
                    <MoodPicker value={record.moodId} onChange={setMood} />
                  </div>

                  <div className="space-y-4">
                    <h3 className="section-title">任务</h3>
                    <div className="mt-2">
                      <TaskList
                        tasks={record.tasks}
                        onAddTask={addTask}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="section-title">自评（1～10 分）</h3>
                    {isSelectedFuture ? (
                      <>
                        <p className="text-base text-slate-600">
                          未来日期不能打分；到达当天后可在「当下」或本页对那一天自评。
                        </p>
                        {record.rating !== null && (
                          <p className="text-sm text-slate-500">
                            （本地若存在分数将被忽略，保存时不写入评分。）
                          </p>
                        )}
                        <StarRating value={null} readOnly />
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-500">点击星星选择分数，可随时修改。</p>
                        <StarRating value={record.rating} onChange={setRating} />
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="section-title">今日记录</h3>
                    <DailyNote value={record.note} onChange={setNote} />
                  </div>
                </>
              )}
            </section>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOldEditOpen}
        title="确认编辑"
        message="确定更改这一天的记录吗？"
        confirmLabel="确定"
        cancelLabel="取消"
        onConfirm={handleConfirmOldEdit}
        onCancel={handleCancelOldEdit}
      />
    </main>
  );
};

export default HistoryPage;
