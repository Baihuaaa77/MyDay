import { type FC, type Ref, useCallback } from "react";
import { ListChecks, NotebookPen, SmilePlus } from "lucide-react";
import type { DayRecordEditor } from "../hooks/useDayRecordEditor";
import { createEmptyRecord } from "../data/storage";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { diffCalendarDays } from "../utils/dateUtils";
import DailyNote from "./DailyNote";
import MoodPicker from "./MoodPicker";
import StarRating from "./StarRating";
import TaskList from "./TaskList";
import { useToast } from "./Toast";

type Relation = "past" | "yesterday" | "today" | "tomorrow" | "future";

interface Copy {
  taskTitle: string;
  taskEmpty: string;
  taskPlaceholder: string;
  checkinTitle: string;
  noteTitle: string;
  notePlaceholder: string;
  prompts: readonly string[];
}

const COPY: Record<Relation, Copy> = {
  today: {
    taskTitle: "今日任务",
    taskEmpty: "今天还没有任务。先写下一件最想推进的小事吧。",
    taskPlaceholder: "今天要做什么？",
    checkinTitle: "今日状态",
    noteTitle: "今日记录",
    notePlaceholder: "今天发生了什么？有什么想留住的感受或想法？",
    prompts: ["最有成就感的事", "学到了什么", "想感谢的人", "明天想改进"],
  },
  yesterday: {
    taskTitle: "昨日任务",
    taskEmpty: "昨天没有留下任务。可以补上一件已经完成或想复盘的事。",
    taskPlaceholder: "补充昨天的任务",
    checkinTitle: "昨日状态",
    noteTitle: "昨日记录",
    notePlaceholder: "回头看看昨天，有什么值得补充的？",
    prompts: ["做得好的地方", "遇到的阻碍", "下次怎么做"],
  },
  tomorrow: {
    taskTitle: "明日计划",
    taskEmpty: "明天还没有计划。先放进一件确定要做的事吧。",
    taskPlaceholder: "明天要做什么？",
    checkinTitle: "期待的状态",
    noteTitle: "给明天的便签",
    notePlaceholder: "写下明天需要提醒自己的事",
    prompts: ["最重要的一件事", "需要准备的东西"],
  },
  past: {
    taskTitle: "当日任务",
    taskEmpty: "这一天没有任务记录。",
    taskPlaceholder: "补充这一天的任务",
    checkinTitle: "当日状态",
    noteTitle: "当日记录",
    notePlaceholder: "写下这一天想留下的内容",
    prompts: [],
  },
  future: {
    taskTitle: "计划任务",
    taskEmpty: "这一天还没有计划。",
    taskPlaceholder: "提前安排一件事",
    checkinTitle: "期待的状态",
    noteTitle: "便签",
    notePlaceholder: "写下需要提醒自己的事",
    prompts: [],
  },
};

function getRelation(date: string, today: string): Relation {
  const delta = diffCalendarDays(today, date);
  if (delta === 0) {
    return "today";
  }
  if (delta === -1) {
    return "yesterday";
  }
  if (delta === 1) {
    return "tomorrow";
  }
  return delta < 0 ? "past" : "future";
}

export interface DayEditorProps {
  date: string;
  today: string;
  editor: DayRecordEditor;
  readOnly?: boolean;
  taskInputRef?: Ref<HTMLInputElement>;
  /** 历史页右侧较窄，改为单列 */
  compact?: boolean;
}

const DayEditor: FC<DayEditorProps> = ({
  date,
  today,
  editor,
  readOnly = false,
  taskInputRef,
  compact = false,
}) => {
  const showToast = useToast();
  const isWide = useMediaQuery("(min-width: 1024px)");
  const relation = getRelation(date, today);
  const copy = COPY[relation];
  const isFuture = relation === "tomorrow" || relation === "future";
  const record = editor.record ?? createEmptyRecord(date);
  const loaded = editor.record !== null;
  const editable = !readOnly && loaded;

  const total = record.tasks.length;
  const completed = record.tasks.filter((task) => task.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const { deleteTask, restoreTask } = editor;
  const handleDelete = useCallback(
    (id: string) => {
      const deleted = deleteTask(id);
      if (deleted !== null) {
        showToast({
          message: `已删除「${deleted.task.title}」`,
          actionLabel: "撤销",
          onAction: () => restoreTask(deleted),
          duration: 5000,
        });
      }
    },
    [deleteTask, restoreTask, showToast],
  );

  const tasksCard = (
    <section className="card" aria-labelledby={`tasks-${date}`}>
      <div className="card-header mb-3">
        <h2 id={`tasks-${date}`} className="card-title">
          <span className="card-title-icon">
            <ListChecks className="h-[18px] w-[18px]" aria-hidden />
          </span>
          {copy.taskTitle}
        </h2>
        {total > 0 ? (
          <span className="tabular mt-1.5 text-sm font-semibold text-ink-2">
            {completed}
            <span className="text-ink-3"> / {total}</span>
          </span>
        ) : null}
      </div>
      {total > 0 ? (
        <div className="progress-track mb-4" aria-hidden>
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      {loaded ? (
        <TaskList
          tasks={record.tasks}
          recordDate={date}
          readOnly={!editable}
          emptyText={copy.taskEmpty}
          inputPlaceholder={copy.taskPlaceholder}
          inputRef={taskInputRef}
          onAddTasks={editor.addTasks}
          onToggleTask={editor.toggleTask}
          onUpdateTaskTitle={editor.updateTaskTitle}
          onPinTask={editor.pinTask}
          onReorderTasks={editor.reorderTasks}
          onDeleteTask={handleDelete}
        />
      ) : (
        <div className="space-y-2" aria-hidden>
          <div className="skeleton h-12" />
          <div className="skeleton h-10" />
          <div className="skeleton h-10 w-4/5" />
        </div>
      )}
    </section>
  );

  const checkinCard = (
    <section className="card" aria-labelledby={`checkin-${date}`}>
      <div className="card-header">
        <h2 id={`checkin-${date}`} className="card-title">
          <span className="card-title-icon bg-warm-soft text-warm">
            <SmilePlus className="h-[18px] w-[18px]" aria-hidden />
          </span>
          {copy.checkinTitle}
        </h2>
      </div>
      <MoodPicker value={record.moodId} onChange={editor.setMood} readOnly={!editable} />
      <div className="mt-5 border-t border-line/70 pt-4">
        <p className="mb-2 text-sm font-semibold text-ink-2">自评</p>
        {isFuture ? (
          <p className="rounded-xl bg-surface-2 px-3 py-3 text-sm text-ink-3">
            这一天还没到来，到时候再来打分吧。
          </p>
        ) : (
          <StarRating value={record.rating} onChange={editor.setRating} readOnly={!editable} />
        )}
      </div>
    </section>
  );

  const noteCard = (
    <section className="card" aria-labelledby={`note-${date}`}>
      <div className="card-header">
        <h2 id={`note-${date}`} className="card-title">
          <span className="card-title-icon">
            <NotebookPen className="h-[18px] w-[18px]" aria-hidden />
          </span>
          {copy.noteTitle}
        </h2>
      </div>
      {loaded ? (
        <DailyNote
          value={record.note}
          onChange={editor.setNote}
          readOnly={!editable}
          placeholder={copy.notePlaceholder}
          ariaLabel={copy.noteTitle}
          saveState={editor.saveState}
          prompts={copy.prompts}
        />
      ) : (
        <div className="skeleton h-36" aria-hidden />
      )}
    </section>
  );

  if (compact || !isWide) {
    return (
      <div className="flex flex-col gap-4">
        {compact ? checkinCard : null}
        {tasksCard}
        {compact ? null : checkinCard}
        {noteCard}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-5">
      <div className="flex min-w-0 flex-col gap-5">
        {tasksCard}
        {noteCard}
      </div>
      <div className="sticky top-24 min-w-0">{checkinCard}</div>
    </div>
  );
};

export default DayEditor;
