import {
  type CSSProperties,
  type FC,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown } from "lucide-react";
import type { Task } from "../types";
import TaskInput from "./TaskInput";
import TaskItem, { type TaskDropPosition } from "./TaskItem";

export interface TaskListProps {
  tasks: Task[];
  recordDate: string;
  readOnly?: boolean;
  emptyText?: string;
  inputPlaceholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  onAddTasks?: (titles: string[]) => void;
  onToggleTask?: (id: string) => void;
  onUpdateTaskTitle?: (id: string, title: string) => void;
  onPinTask?: (id: string) => void;
  onReorderTasks?: (activeId: string, overId: string, position: "before" | "after") => void;
  onDeleteTask?: (id: string) => void;
}

interface DragState {
  id: string;
  pointerId: number;
  group: "pending" | "done";
  overId: string | null;
  position: TaskDropPosition;
}

const CONFETTI = ["🎉", "✨", "⭐", "🎊", "💫", "🌟", "✨", "🎉"];

const Celebration: FC = () => (
  <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
    {CONFETTI.map((emoji, index) => {
      const angle = (index / CONFETTI.length) * Math.PI * 2;
      const style = {
        "--dx": `${Math.cos(angle) * 90}px`,
        "--dy": `${Math.sin(angle) * 60}px`,
        "--rot": `${index % 2 === 0 ? 120 : -120}deg`,
        animationDelay: `${index * 30}ms`,
      } as CSSProperties;
      return (
        <span key={index} className="confetti-piece" style={style}>
          {emoji}
        </span>
      );
    })}
  </div>
);

const TaskList: FC<TaskListProps> = ({
  tasks,
  recordDate,
  readOnly = false,
  emptyText = "还没有任务。先写下一件最想推进的小事吧。",
  inputPlaceholder,
  inputRef,
  onAddTasks,
  onToggleTask,
  onUpdateTaskTitle,
  onPinTask,
  onReorderTasks,
  onDeleteTask,
}) => {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [doneCollapsed, setDoneCollapsed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  const pending = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const done = useMemo(() => tasks.filter((task) => task.completed), [tasks]);

  // 最后一项待办被勾掉时放一个小小的庆祝动画
  const prevPendingRef = useRef<{ date: string; count: number } | null>(null);
  useEffect(() => {
    const prev = prevPendingRef.current;
    if (
      prev !== null &&
      prev.date === recordDate &&
      prev.count > 0 &&
      pending.length === 0 &&
      done.length > 0
    ) {
      setCelebrating(true);
      const timer = window.setTimeout(() => setCelebrating(false), 1200);
      prevPendingRef.current = { date: recordDate, count: pending.length };
      return () => window.clearTimeout(timer);
    }
    prevPendingRef.current = { date: recordDate, count: pending.length };
    return undefined;
  }, [done.length, pending.length, recordDate]);

  const updateDrag = (next: DragState | null): void => {
    dragRef.current = next;
    setDrag(next);
  };

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, id: string): void => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      const task = tasks.find((item) => item.id === id);
      if (task === undefined) {
        return;
      }
      updateDrag({
        id,
        pointerId: event.pointerId,
        group: task.completed ? "done" : "pending",
        overId: null,
        position: null,
      });
    },
    [tasks],
  );

  const isDragging = drag !== null;
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMove = (event: PointerEvent): void => {
      const current = dragRef.current;
      if (current === null || event.pointerId !== current.pointerId) {
        return;
      }
      event.preventDefault();

      // 靠近视口边缘时自动滚动
      if (event.clientY < 72) {
        window.scrollBy(0, -12);
      } else if (event.clientY > window.innerHeight - 96) {
        window.scrollBy(0, 12);
      }

      const row = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-task-id]");
      const overId = row?.dataset.taskId ?? null;
      if (row === null || row === undefined || overId === null || row.dataset.group !== current.group) {
        return;
      }
      if (overId === current.id) {
        if (current.overId !== null) {
          updateDrag({ ...current, overId: null, position: null });
        }
        return;
      }
      const rect = row.getBoundingClientRect();
      const position: TaskDropPosition = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
      if (overId !== current.overId || position !== current.position) {
        updateDrag({ ...current, overId, position });
      }
    };

    const handleUp = (event: PointerEvent): void => {
      const current = dragRef.current;
      if (current === null || event.pointerId !== current.pointerId) {
        return;
      }
      if (current.overId !== null && current.position !== null) {
        onReorderTasks?.(current.id, current.overId, current.position);
      }
      updateDrag(null);
    };

    const handleCancel = (): void => updateDrag(null);
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        updateDrag(null);
      }
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
    window.addEventListener("keydown", handleKey);
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
      window.removeEventListener("keydown", handleKey);
      document.body.style.userSelect = "";
    };
  }, [isDragging, onReorderTasks]);

  const renderGroup = (items: Task[], group: "pending" | "done"): JSX.Element => (
    <ul className="flex flex-col gap-0.5">
      {items.map((task, index) => (
        <li key={task.id} data-task-id={task.id} data-group={group} className="animate-fade-in">
          <TaskItem
            task={task}
            recordDate={recordDate}
            readOnly={readOnly}
            canPin={index > 0}
            dragging={drag?.id === task.id}
            dropPosition={drag?.overId === task.id ? drag.position : null}
            onToggle={onToggleTask}
            onUpdateTitle={onUpdateTaskTitle}
            onPin={onPinTask}
            onDelete={onDeleteTask}
            onHandlePointerDown={items.length > 1 ? handlePointerDown : undefined}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && onAddTasks !== undefined ? (
        <TaskInput ref={inputRef} onAdd={onAddTasks} placeholder={inputPlaceholder} />
      ) : null}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line px-4 py-8 text-center">
          <span className="text-3xl animate-float" aria-hidden>
            🌱
          </span>
          <p className="max-w-xs text-sm leading-6 text-ink-2">{emptyText}</p>
          {!readOnly ? (
            <p className="text-xs text-ink-3">小技巧：粘贴多行文本可一次添加多个任务</p>
          ) : null}
        </div>
      ) : (
        <div className="relative">
          {pending.length > 0 ? (
            renderGroup(pending, "pending")
          ) : (
            <div className="relative flex items-center justify-center gap-2 rounded-xl bg-brand-soft/70 px-4 py-4 text-sm font-semibold text-brand-strong">
              {celebrating ? <Celebration /> : null}
              <span aria-hidden>🎉</span>
              全部完成，干得漂亮！
            </div>
          )}

          {done.length > 0 ? (
            <div className="mt-3">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-ink-3 transition hover:bg-surface-2 hover:text-ink-2"
                onClick={() => setDoneCollapsed((value) => !value)}
                aria-expanded={!doneCollapsed}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${doneCollapsed ? "-rotate-90" : ""}`}
                  aria-hidden
                />
                已完成 {done.length}
                <span className="h-px flex-1 bg-line" aria-hidden />
              </button>
              {!doneCollapsed ? <div className="mt-1">{renderGroup(done, "done")}</div> : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TaskList;
