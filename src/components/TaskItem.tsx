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
    <div className="soft-list-item flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className="shrink-0 rounded-lg p-1.5 text-teal-700 transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
        aria-label={task.completed ? "标记为未完成" : "标记为已完成"}
        aria-pressed={task.completed}
      >
        {task.completed ? (
          <CheckSquare className="h-6 w-6 text-teal-600" aria-hidden />
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
        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-label="删除任务"
      >
        <Trash2 className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
};

export default TaskItem;
