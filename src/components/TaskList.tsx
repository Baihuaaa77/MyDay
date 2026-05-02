import { type FC } from "react";
import { Inbox } from "lucide-react";
import type { Task } from "../types";
import TaskInput from "./TaskInput";
import TaskItem from "./TaskItem";

/**
 * TaskList 的入参：由父组件持有任务数组与业务逻辑，本组件只负责排版与组合子组件。
 */
export interface TaskListProps {
  /** 当前要展示的任务列表 */
  tasks: Task[];
  /** 添加新任务：父组件传入标题后生成 Task 并更新状态 / 存储 */
  onAddTask: (title: string) => void;
  /** 切换某条任务的完成状态 */
  onToggleTask: (id: string) => void;
  /** 删除某条任务 */
  onDeleteTask: (id: string) => void;
}

/**
 * 任务列表容器：上方 TaskInput，下方按顺序渲染多条 TaskItem。
 * 若列表为空，显示简短提示（仍保留输入区，方便直接添加第一条）。
 */
const TaskList: FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <TaskInput onAdd={onAddTask} />

      {tasks.length === 0 ? (
        <div className="panel-muted flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-teal-500 shadow-sm">
            <Inbox className="h-9 w-9" strokeWidth={1.25} aria-hidden />
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-500">
            今天也是充满希望的一天，添加你的第一个任务吧！在上方输入标题并点击「添加」即可。
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskItem
                task={task}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
