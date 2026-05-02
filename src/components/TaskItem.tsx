import { type FC } from "react";
import { CheckSquare, Square, Trash2 } from "lucide-react";
import type { Task } from "../types";

/**
 * TaskItem 的入参：展示一条任务，并把勾选 / 删除操作交给父组件。
 */
export interface TaskItemProps {
  /** 要展示的一条任务数据 */
  task: Task;
  /** 切换完成状态时调用，参数为任务 id */
  onToggle: (id: string) => void;
  /** 删除任务时调用，参数为任务 id */
  onDelete: (id: string) => void;
}

/**
 * 单行任务：左侧用图标按钮切换完成；中间标题在完成时加删除线；
 * 右侧删除按钮。全部用 Tailwind 排版，图标来自 lucide-react。
 */
const TaskItem: FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const handleToggle = (): void => {
    onToggle(task.id);
  };

  const handleDelete = (): void => {
    onDelete(task.id);
  };

  return (
    <div className="soft-list-item flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={handleToggle}
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
        onClick={handleDelete}
        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-label="删除任务"
      >
        <Trash2 className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
};

export default TaskItem;
