import { type DragEventHandler, type FC, type PointerEventHandler, useEffect, useRef, useState } from "react";
import { Inbox } from "lucide-react";
import type { Task } from "../types";
import TaskInput from "./TaskInput";
import TaskItem from "./TaskItem";

export interface TaskListProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onUpdateTaskTitle: (id: string, title: string) => void;
  onPinTask: (id: string) => void;
  onReorderTasks: (activeId: string, overId: string) => void;
  onDeleteTask: (id: string) => void;
  emptyText?: string;
  inputPlaceholder?: string;
}

const TaskList: FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onUpdateTaskTitle,
  onPinTask,
  onReorderTasks,
  onDeleteTask,
  emptyText = "还没有任务。可以先添加一件最想推进的小事。",
  inputPlaceholder = "输入新任务标题",
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const pointerDragRef = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const resetDragState = (): void => {
    pointerDragRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  const getTaskIdAtPoint = (x: number, y: number): string | null => {
    const element = document.elementFromPoint(x, y);
    const row = element?.closest("[data-task-row-id]");
    return row instanceof HTMLElement ? row.dataset.taskRowId ?? null : null;
  };

  useEffect(() => {
    if (draggingId === null) {
      return;
    }

    const handlePointerMove = (event: PointerEvent): void => {
      const current = pointerDragRef.current;
      if (current === null || event.pointerId !== current.pointerId) {
        return;
      }

      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      if (!current.moved && Math.hypot(dx, dy) > 4) {
        current.moved = true;
      }

      if (!current.moved) {
        return;
      }

      event.preventDefault();
      const nextOverId = getTaskIdAtPoint(event.clientX, event.clientY);
      if (nextOverId !== null && nextOverId !== current.id) {
        setDragOverId(nextOverId);
      }
    };

    const handlePointerUp = (event: PointerEvent): void => {
      const current = pointerDragRef.current;
      if (current === null || event.pointerId !== current.pointerId) {
        return;
      }

      const finalOverId = getTaskIdAtPoint(event.clientX, event.clientY) ?? dragOverId;
      if (current.moved && finalOverId !== null && finalOverId !== current.id) {
        onReorderTasks(current.id, finalOverId);
      }
      resetDragState();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", resetDragState);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", resetDragState);
    };
  }, [dragOverId, draggingId, onReorderTasks]);

  const handleNativeDragStart = (taskId: string): DragEventHandler<HTMLLIElement> => (event) => {
    setDraggingId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  };

  const handleNativeDragOver = (taskId: string): DragEventHandler<HTMLLIElement> => (event) => {
    event.preventDefault();
    const activeId = event.dataTransfer.getData("text/plain") || draggingId;
    if (activeId !== null && activeId !== taskId) {
      setDragOverId(taskId);
    }
  };

  const handleNativeDrop = (taskId: string): DragEventHandler<HTMLLIElement> => (event) => {
    event.preventDefault();
    const activeId = event.dataTransfer.getData("text/plain") || draggingId;
    if (activeId !== null && activeId !== taskId) {
      onReorderTasks(activeId, taskId);
    }
    resetDragState();
  };

  const handleDragHandlePointerDown =
    (taskId: string): PointerEventHandler<HTMLButtonElement> =>
    (event) => {
      if (event.button !== 0) {
        return;
      }
      pointerDragRef.current = {
        id: taskId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
      setDraggingId(taskId);
      setDragOverId(null);
    };

  return (
    <div className="flex flex-col gap-6">
      <TaskInput onAdd={onAddTask} placeholder={inputPlaceholder} />

      {tasks.length === 0 ? (
        <div className="panel-muted flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#10aab2] shadow-sm">
            <Inbox className="h-9 w-9" strokeWidth={1.25} aria-hidden />
          </div>
          <p className="task-empty-copy">{emptyText}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              data-task-row-id={task.id}
              draggable={draggingId === task.id}
              onDragStart={handleNativeDragStart(task.id)}
              onDragOver={handleNativeDragOver(task.id)}
              onDrop={handleNativeDrop(task.id)}
              onDragEnd={resetDragState}
              className={`task-sort-row ${
                draggingId === task.id
                  ? "task-sort-row-dragging"
                  : dragOverId === task.id
                    ? "task-sort-row-over"
                    : ""
              }`}
            >
              <TaskItem
                task={task}
                onToggle={onToggleTask}
                onUpdateTitle={onUpdateTaskTitle}
                onPin={onPinTask}
                onDelete={onDeleteTask}
                onDragHandlePointerDown={handleDragHandlePointerDown(task.id)}
                dragging={draggingId === task.id}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
