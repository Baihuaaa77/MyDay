import { type FC } from "react";
import { Inbox } from "lucide-react";
import type { Task } from "../types";
import TaskInput from "./TaskInput";
import TaskItem from "./TaskItem";

export interface TaskListProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  emptyText?: string;
  inputPlaceholder?: string;
}

const TaskList: FC<TaskListProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  emptyText = "还没有任务。可以先添加一件最想推进的小事。",
  inputPlaceholder = "输入新任务标题",
}) => {
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
