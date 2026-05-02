import { type FC, useMemo, useState } from "react";
import { CalendarClock, ListChecks, NotebookText, Sparkles, Sun } from "lucide-react";
import {
  formatDisplayDate,
  getTodayString,
  getYesterdayString,
  getTomorrowString,
  isFutureDateString,
} from "../utils/dateUtils";
import { useDayRecordEditor } from "../hooks/useDayRecordEditor";
import TaskList from "../components/TaskList";
import StarRating from "../components/StarRating";
import DailyNote from "../components/DailyNote";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import MoodPicker from "../components/MoodPicker";

/**
 * 「昨天 / 今天 / 明天」三选一，映射到对应的 "YYYY-MM-DD"。
 * 用于「当下」页顶部的日期切换（只在这三天之间切换，不包含任意历史日）。
 */
function getDateStrForFocus(
  focus: "yesterday" | "today" | "tomorrow",
): string {
  switch (focus) {
    case "yesterday":
      return getYesterdayString();
    case "tomorrow":
      return getTomorrowString();
    default:
      return getTodayString();
  }
}

/**
 * 「当下」主页面：重新设计的布局，将每日状态 emoji 作为页面核心卖点。
 *
 * 布局结构（自上而下）：
 * 1. 顶部标题栏 + 日期切换
 * 2. ★ 今日状态 emoji 选择器 —— 醒目的中央大卡片，页面视觉焦点
 * 3. 任务 / 自评 / 记录 —— 宽屏并排展示
 */
const NowPage: FC = () => {
  const [focus, setFocus] = useState<"yesterday" | "today" | "tomorrow">("today");

  const activeDateStr = useMemo(() => getDateStrForFocus(focus), [focus]);

  const {
    record,
    addTask,
    toggleTask,
    deleteTask,
    setRating,
    setNote,
    setMood,
  } = useDayRecordEditor(activeDateStr);

  const handleFocusChange = (next: "yesterday" | "today" | "tomorrow"): void => {
    setFocus(next);
  };

  const isPlanningTomorrow = isFutureDateString(activeDateStr);

  const focusButtonClass = (isActive: boolean): string =>
    `segmented-button flex-1 ${isActive ? "segmented-button-active" : "segmented-button-idle"}`;

  return (
    <main className="page-shell">
      {/* ─── 顶部：标题 + 引言 + 日期切换 ─── */}
      <header className="page-header">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="icon-tile">
              <Sun className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="eyebrow">Today workspace</p>
              <h1 className="page-title">当下</h1>
            </div>
          </div>
          <QuoteOfTheDay variant="present" className="mt-3 max-w-2xl" />
        </div>

        <div
          className="control-shell flex w-full max-w-sm"
          role="tablist"
          aria-label="选择昨天、今天或明天"
        >
          <button
            type="button"
            role="tab"
            aria-selected={focus === "yesterday"}
            className={focusButtonClass(focus === "yesterday")}
            onClick={() => handleFocusChange("yesterday")}
          >
            昨天
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={focus === "today"}
            className={focusButtonClass(focus === "today")}
            onClick={() => handleFocusChange("today")}
          >
            今天
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={focus === "tomorrow"}
            className={focusButtonClass(focus === "tomorrow")}
            onClick={() => handleFocusChange("tomorrow")}
          >
            明天
          </button>
        </div>
      </header>

      {/* ─── ★ 核心卖点：今日状态 emoji 选择器，醒目的居中大卡片 ─── */}
      <section className="panel panel-interactive mt-6 overflow-hidden p-0 sm:p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex min-h-64 flex-col justify-between border-b border-teal-100/80 bg-gradient-to-br from-teal-50 via-white to-amber-50/70 p-6 text-slate-900 lg:border-b-0 lg:border-r lg:border-teal-100/80 lg:p-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/75 px-3 py-1 text-xs font-semibold text-teal-700 shadow-sm">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                {formatDisplayDate(activeDateStr)}
              </div>
              <h2 className="mt-6 max-w-md text-3xl font-bold leading-tight sm:text-4xl">
                用一个状态，为今天定调。
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                任务、评分和记录都会围绕这一天展开，保持轻量，但信息足够完整。
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm font-medium text-slate-600">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-amber-500 shadow-sm">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <span>你的每日工作台已就绪</span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="section-title">今日状态</h2>
                <p className="section-copy">选择一个最能代表今天的 emoji</p>
              </div>
            </div>
            <MoodPicker value={record?.moodId ?? null} onChange={setMood} />
          </div>
        </div>
      </section>

      {/* ─── 下方三栏：任务 / 自评 / 今日记录 ─── */}
      <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-6">
        {/* 任务区 */}
        <div className="lg:col-span-5">
          <section className="panel panel-interactive">
            <div className="flex items-start gap-3">
              <div className="icon-tile">
                <ListChecks className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="section-title">任务</h2>
                <p className="section-copy">
                  {focus === "yesterday" && "补充或修改昨天的任务与完成情况。"}
                  {focus === "today" && "今天的待办与完成状态。"}
                  {focus === "tomorrow" && "为明天提前列好计划（到达明天后可在「今天」里继续执行）。"}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <TaskList
                tasks={record?.tasks ?? []}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
              />
            </div>
          </section>
        </div>

        {/* 自评 + 今日记录 */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <section className="panel panel-interactive">
            <div className="flex items-start gap-3">
              <div className="icon-tile">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="section-title">自评（1～10 分）</h2>
                <p className="section-copy">
                  {isPlanningTomorrow ? "明天尚未到来，先计划，后复盘。" : "点击星星选择分数，可随时修改。"}
                </p>
              </div>
            </div>
            {isPlanningTomorrow ? (
              <>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  明天尚未到来，不能为明天打分；到「今天」切换到该日时即可自评。
                </p>
                {record?.rating !== null && record !== null && (
                  <p className="mt-2 text-sm text-slate-500">
                    （若本地曾有分数，保存明日计划时不会写入自评。）
                  </p>
                )}
                <div className="mt-4">
                  <StarRating value={null} readOnly />
                </div>
              </>
            ) : (
              <div className="mt-4">
                <StarRating value={record?.rating ?? null} onChange={setRating} />
              </div>
            )}
          </section>

          <section className="panel panel-interactive">
            <div className="flex items-start gap-3">
              <div className="icon-tile">
                <NotebookText className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="section-title">今日记录</h2>
                <p className="section-copy">沉淀当天的关键进展、感受或复盘。</p>
              </div>
            </div>
            <div className="mt-4">
              <DailyNote value={record?.note ?? ""} onChange={setNote} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default NowPage;
