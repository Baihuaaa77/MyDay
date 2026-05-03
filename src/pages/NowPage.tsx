import { type FC, useMemo, useState } from "react";
import {
  CalendarClock,
  ListChecks,
  NotebookText,
  SmilePlus,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";
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

type Focus = "yesterday" | "today" | "tomorrow";

function getDateStrForFocus(focus: Focus): string {
  switch (focus) {
    case "yesterday":
      return getYesterdayString();
    case "tomorrow":
      return getTomorrowString();
    default:
      return getTodayString();
  }
}

const NowPage: FC = () => {
  const [focus, setFocus] = useState<Focus>("today");
  const activeDateStr = useMemo(() => getDateStrForFocus(focus), [focus]);

  const {
    record,
    loading,
    error,
    addTask,
    toggleTask,
    deleteTask,
    setRating,
    setNote,
    setMood,
  } = useDayRecordEditor(activeDateStr);

  const isPlanningTomorrow = isFutureDateString(activeDateStr);
  const currentRating = record?.rating ?? null;
  const ratingSummaryLabel = isPlanningTomorrow
    ? "暂不评分"
    : currentRating === null
      ? "未评分"
      : `${currentRating}`;

  const focusCopy = {
    yesterday: {
      eyebrow: "Yesterday review",
      heroTitle: "补充昨天的状态与记录。",
      moodTitle: "昨日状态",
      moodBody: "选择一个最能代表昨天的状态。",
      moodEmptyLabel: "选一个代表昨天的状态吧",
      ratingBody: "给昨天一个自评分，方便之后回看趋势。",
      taskTitle: "昨日任务",
      taskBody: "补充或修改昨天的任务与完成情况。",
      noteTitle: "昨日记录",
      noteBody: "写下昨天的关键进展、感受或复盘。",
      notePlaceholder: "写下昨天值得补充的内容",
      taskEmptyText: "昨天还没有留下任务。可以补上一件已经完成或想复盘的事。",
      footer: "昨天的线索已归位",
    },
    today: {
      eyebrow: "Today workspace",
      heroTitle: "记录今天的状态与进展。",
      moodTitle: "今日状态",
      moodBody: "选择一个最能代表今天的状态。",
      moodEmptyLabel: "选一个代表今天的状态吧",
      ratingBody: "点击星星给今天打分，可随时修改。",
      taskTitle: "今日任务",
      taskBody: "安排今天的待办，也勾掉已经完成的事。",
      noteTitle: "今日记录",
      noteBody: "沉淀今天的关键进展、感受或复盘。",
      notePlaceholder: "写下今天想留下的内容",
      taskEmptyText: "今天还没有任务。可以先添加一件最想推进的小事。",
      footer: "今天的工作台已就绪",
    },
    tomorrow: {
      eyebrow: "Tomorrow plan",
      heroTitle: "提前安排明天的计划。",
      moodTitle: "明日状态",
      moodBody: "选择一个你希望带进明天的状态。",
      moodEmptyLabel: "选一个你希望带进明天的状态吧",
      ratingBody: "明天还没有发生，评分会留到当天再填写。",
      taskTitle: "明日任务",
      taskBody: "提前列好计划，到明天后继续执行。",
      noteTitle: "明日记录",
      noteBody: "先记下明天需要提醒自己的事。",
      notePlaceholder: "写下明天需要提醒自己的事",
      taskEmptyText: "明天还没有计划。可以先放进一件确定要做的事。",
      footer: "明天的入口已轻轻打开",
    },
  }[focus];

  const focusButtonClass = (isActive: boolean): string =>
    `segmented-button min-w-0 flex-1 ${isActive ? "segmented-button-active" : "segmented-button-idle"}`;

  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="icon-tile">
              <Sun className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="eyebrow">{focusCopy.eyebrow}</p>
              <h1 className="page-title">当下</h1>
            </div>
          </div>
          <QuoteOfTheDay variant="present" className="mt-3 max-w-2xl" />
          {error !== null && (
            <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
          )}
          {loading && (
            <p className="mt-3 text-sm font-medium text-slate-500">正在读取本地记录...</p>
          )}
        </div>

        <div
          className="control-shell mobile-fit-control flex w-full min-w-0 max-w-md"
          role="tablist"
          aria-label="选择昨天、今天或明天"
        >
          <button
            type="button"
            role="tab"
            aria-selected={focus === "yesterday"}
            className={focusButtonClass(focus === "yesterday")}
            onClick={() => setFocus("yesterday")}
          >
            昨天
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={focus === "today"}
            className={focusButtonClass(focus === "today")}
            onClick={() => setFocus("today")}
          >
            今天
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={focus === "tomorrow"}
            className={focusButtonClass(focus === "tomorrow")}
            onClick={() => setFocus("tomorrow")}
          >
            明天
          </button>
        </div>
      </header>

      <section className="panel panel-glow panel-interactive mt-6 overflow-hidden p-0 sm:p-0">
        <div className="grid min-w-0 max-w-full gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
          <div className="min-w-0 max-w-full rounded-t-2xl border-b border-teal-100/80 bg-gradient-to-br from-teal-50 via-white to-amber-50/70 p-4 text-slate-900 sm:p-6 lg:rounded-l-2xl lg:rounded-tr-none lg:border-b-0 lg:border-r lg:border-teal-100/80 lg:p-8">
            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-teal-200/80 bg-white/75 px-3 py-2 text-sm font-semibold text-teal-700 shadow-sm sm:gap-2.5 sm:px-4 sm:text-base">
                <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                {formatDisplayDate(activeDateStr)}
              </div>
              <h2 className="mt-4 max-w-lg text-2xl font-bold leading-tight sm:mt-6 sm:text-4xl">
                {focusCopy.heroTitle}
              </h2>
            </div>
            <div className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-600 sm:mt-8">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-amber-500 shadow-sm">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <span>{focusCopy.footer}</span>
            </div>
          </div>

          <div className="grid min-w-0 max-w-full gap-5 p-4 sm:gap-6 sm:p-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)]">
            <div>
              <div className="flex items-start gap-3">
                <div className="icon-tile">
                  <SmilePlus className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2 className="section-title">{focusCopy.moodTitle}</h2>
                  <p className="section-copy">{focusCopy.moodBody}</p>
                </div>
              </div>
              <div className="mt-4">
                <MoodPicker
                  value={record?.moodId ?? null}
                  onChange={setMood}
                  emptyLabel={focusCopy.moodEmptyLabel}
                />
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3">
                <div className="icon-tile">
                  <Star className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2 className="section-title">自评</h2>
                  <p className="section-copy">{focusCopy.ratingBody}</p>
                </div>
              </div>
              {isPlanningTomorrow ? (
                <>
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    未来日期暂不写入评分；到当天后即可补上自评。
                  </p>
                  <div className="mt-4 overflow-visible">
                    <StarRating value={null} readOnly />
                  </div>
                </>
              ) : (
                <div className="mt-4 overflow-visible">
                  <StarRating value={record?.rating ?? null} onChange={setRating} />
                </div>
              )}
              <div className="mobile-fit-control mt-3 flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 shadow-inner">
                <span className="text-sm font-medium text-slate-600">当前分数</span>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold leading-none text-slate-950">
                    {ratingSummaryLabel}
                  </span>
                  {!isPlanningTomorrow && currentRating !== null && (
                    <span className="text-sm font-semibold text-slate-500">/ 10</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="panel panel-glow-cool panel-interactive h-full">
          <div className="flex items-start gap-3">
            <div className="icon-tile">
              <ListChecks className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="section-title">{focusCopy.taskTitle}</h2>
              <p className="section-copy">{focusCopy.taskBody}</p>
            </div>
          </div>
          <div className="mt-5">
            <TaskList
              tasks={record?.tasks ?? []}
              onAddTask={addTask}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              emptyText={focusCopy.taskEmptyText}
            />
          </div>
        </section>

        <section className="panel panel-glow-warm panel-interactive h-full">
          <div className="flex items-start gap-3">
            <div className="icon-tile">
              <NotebookText className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="section-title">{focusCopy.noteTitle}</h2>
              <p className="section-copy">{focusCopy.noteBody}</p>
            </div>
          </div>
          <div className="mt-5">
            <DailyNote
              value={record?.note ?? ""}
              onChange={setNote}
              placeholder={focusCopy.notePlaceholder}
              ariaLabel={focusCopy.noteTitle}
            />
          </div>
        </section>
      </div>
    </main>
  );
};

export default NowPage;
