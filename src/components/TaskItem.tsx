import {
  type FC,
  type KeyboardEvent,
  type PointerEvent,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowUpToLine, Check, GripVertical, History, Trash2 } from "lucide-react";
import type { Task } from "../types";
import { diffCalendarDays, formatMonthDay } from "../utils/dateUtils";
import { isComposingEnter } from "./TaskInput";

export type TaskDropPosition = "before" | "after" | null;

export interface TaskItemProps {
  task: Task;
  recordDate: string;
  readOnly?: boolean;
  canPin?: boolean;
  dragging?: boolean;
  dropPosition?: TaskDropPosition;
  onToggle?: (id: string) => void;
  onUpdateTitle?: (id: string, title: string) => void;
  onPin?: (id: string) => void;
  onDelete?: (id: string) => void;
  onHandlePointerDown?: (event: PointerEvent<HTMLButtonElement>, id: string) => void;
}

const TaskItem: FC<TaskItemProps> = ({
  task,
  recordDate,
  readOnly = false,
  canPin = true,
  dragging = false,
  dropPosition = null,
  onToggle,
  onUpdateTitle,
  onPin,
  onDelete,
  onHandlePointerDown,
}) => {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [justCompleted, setJustCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraftTitle(task.title);
    }
  }, [editing, task.title]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!justCompleted) {
      return;
    }
    const timer = window.setTimeout(() => setJustCompleted(false), 500);
    return () => window.clearTimeout(timer);
  }, [justCompleted]);

  const saveTitle = (): void => {
    const trimmed = draftTitle.trim();
    if (trimmed !== "" && trimmed !== task.title) {
      onUpdateTitle?.(task.id, trimmed);
    }
    setEditing(false);
  };

  const cancelEditing = (): void => {
    setDraftTitle(task.title);
    setEditing(false);
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" && !isComposingEnter(event)) {
      event.preventDefault();
      saveTitle();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  const carryDays =
    task.carryoverFromDate !== undefined ? diffCalendarDays(task.carryoverFromDate, recordDate) : 0;

  const rowClass = [
    "task-row",
    dragging ? "task-row-dragging" : "",
    dropPosition === "before" ? "task-row-drop-before" : "",
    dropPosition === "after" ? "task-row-drop-after" : "",
  ].join(" ");

  return (
    <div className={rowClass}>
      {!readOnly && onHandlePointerDown !== undefined ? (
        <button
          type="button"
          className="task-handle"
          onPointerDown={(event) => onHandlePointerDown(event, task.id)}
          aria-label="拖动调整任务顺序"
          title="拖动排序"
          tabIndex={-1}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <span className="w-1 shrink-0" aria-hidden />
      )}

      <button
        type="button"
        className="task-check"
        onClick={() => {
          if (!task.completed) {
            setJustCompleted(true);
          }
          onToggle?.(task.id);
        }}
        disabled={readOnly}
        aria-pressed={task.completed}
        aria-label={task.completed ? `标记「${task.title}」为未完成` : `完成「${task.title}」`}
      >
        <span className={`task-check-ring ${justCompleted ? "animate-pop-in" : ""}`}>
          <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden />
        </span>
      </button>

      <div className="min-w-0 flex-1 py-1">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draftTitle}
            maxLength={200}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={saveTitle}
            enterKeyHint="done"
            className="input -my-1 h-9 px-2.5 py-1"
            aria-label="编辑任务内容"
          />
        ) : (
          <button
            type="button"
            className={`block w-full min-w-0 break-words rounded-md text-left text-[15px] leading-6 transition-colors ${
              task.completed ? "text-ink-3 line-through decoration-ink-3/60" : "text-ink"
            } ${readOnly ? "cursor-default" : "cursor-text"}`}
            onClick={() => !readOnly && setEditing(true)}
            disabled={readOnly}
            title={readOnly ? undefined : "点击编辑"}
          >
            {task.title}
          </button>
        )}
        {carryDays > 0 && !editing ? (
          <span
            className={`badge mt-1 ${
              carryDays >= 3 ? "bg-warm-soft text-warm" : "bg-surface-3 text-ink-2"
            }`}
            title={`从 ${formatMonthDay(task.carryoverFromDate ?? "", false)} 自动顺延而来`}
          >
            <History className="h-3 w-3" aria-hidden />
            已顺延 {carryDays} 天
          </span>
        ) : null}
      </div>

      {!readOnly && !editing ? (
        <div className="task-actions">
          {canPin ? (
            <button
              type="button"
              className="icon-btn hover:text-brand-strong"
              onClick={() => onPin?.(task.id)}
              aria-label="置顶任务"
              title="置顶"
            >
              <ArrowUpToLine className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            className="icon-btn hover:bg-danger-soft hover:text-danger"
            onClick={() => onDelete?.(task.id)}
            aria-label="删除任务"
            title="删除"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default memo(TaskItem);
