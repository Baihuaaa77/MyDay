import { type FC } from "react";
import { CheckSquare, Square, Trash2 } from "lucide-react";
import type { Task } from "../types";

export interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskItem: FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  return (
    <div className="soft-list-item flex min-h-14 items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#0b8f99] transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        aria-label={task.completed ? "标记为未完成" : "标记为已完成"}
        aria-pressed={task.completed}
      >
        {task.completed ? (
          <CheckSquare className="h-6 w-6 text-[#10aab2]" aria-hidden />
        ) : (
          <Square className="h-6 w-6 text-slate-400" aria-hidden />
        )}
      </button>

      <span
        className={`min-w-0 flex-1 break-words text-left text-base leading-relaxed ${
          task.completed ? "text-slate-400 line-through" : "text-slate-900"
        }`}
      >
        {task.title}
      </span>

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-label="删除任务"
      >
        <Trash2 className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
};

export default TaskItem;
