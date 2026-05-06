import {
  type FC,
  type KeyboardEventHandler,
  type PointerEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, CheckSquare, GripVertical, Pencil, Pin, Square, Trash2, X } from "lucide-react";
import type { Task } from "../types";

export interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onDragHandlePointerDown: PointerEventHandler<HTMLButtonElement>;
  dragging?: boolean;
}

const TaskItem: FC<TaskItemProps> = ({
  task,
  onToggle,
  onUpdateTitle,
  onPin,
  onDelete,
  onDragHandlePointerDown,
  dragging = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
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

  const saveTitle = (): void => {
    const trimmedTitle = draftTitle.trim();
    if (trimmedTitle === "") {
      setDraftTitle(task.title);
      setEditing(false);
      return;
    }

    if (trimmedTitle !== task.title) {
      onUpdateTitle(task.id, trimmedTitle);
    }
    setEditing(false);
  };

  const cancelEditing = (): void => {
    setDraftTitle(task.title);
    setEditing(false);
  };

  const handleEditKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTitle();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  return (
    <div
      className={`soft-list-item task-item-shell ${
        dragging ? "border-cyan-200 bg-cyan-50/70 shadow-md" : ""
      }`}
    >
      <button
        type="button"
        className="task-drag-handle"
        onPointerDown={onDragHandlePointerDown}
        aria-label="拖动调整任务顺序"
        title="拖动调整顺序"
      >
        <GripVertical className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className="task-icon-action text-[#0b8f99] hover:bg-cyan-50 focus:ring-cyan-400"
        aria-label={task.completed ? "标记为未完成" : "标记为已完成"}
        aria-pressed={task.completed}
      >
        {task.completed ? (
          <CheckSquare className="h-6 w-6 text-[#10aab2]" aria-hidden />
        ) : (
          <Square className="h-6 w-6 text-slate-400" aria-hidden />
        )}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={saveTitle}
          className="task-edit-input"
          aria-label="编辑任务内容"
        />
      ) : (
        <button
          type="button"
          className={`min-w-0 flex-1 break-words rounded-lg px-1 py-1 text-left text-base leading-relaxed transition hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
            task.completed ? "text-slate-400 line-through" : "text-slate-900"
          }`}
          onClick={() => setEditing(true)}
          aria-label={`编辑任务：${task.title}`}
        >
          {task.title}
        </button>
      )}

      {editing ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onPointerDown={(event) => event.preventDefault()}
            onClick={saveTitle}
            className="task-icon-action text-[#0b8f99] hover:bg-cyan-50 focus:ring-cyan-400"
            aria-label="保存任务内容"
          >
            <Check className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onPointerDown={(event) => event.preventDefault()}
            onClick={cancelEditing}
            className="task-icon-action text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:ring-slate-300"
            aria-label="取消编辑"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onPin(task.id)}
            className="task-icon-action text-slate-400 hover:bg-amber-50 hover:text-amber-600 focus:ring-amber-300"
            aria-label="置顶任务"
            title="置顶"
          >
            <Pin className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="task-icon-action text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:ring-slate-300"
            aria-label="编辑任务内容"
          >
            <Pencil className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="task-icon-action text-slate-400 hover:bg-red-50 hover:text-red-600 focus:ring-red-400"
        aria-label="删除任务"
      >
        <Trash2 className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
};

export default TaskItem;
