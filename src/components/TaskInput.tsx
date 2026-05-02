import { type FC, type KeyboardEventHandler, useState } from "react";
import { Plus } from "lucide-react";

/**
 * TaskInput 的入参：父组件负责真正「创建 Task / 写入状态」，
 * 本组件只收集标题并触发回调（类似把按钮的 command 交给外层处理）。
 */
export interface TaskInputProps {
  /** 用户确认添加时调用，传入已去掉首尾空白的标题 */
  onAdd: (title: string) => void;
}

/**
 * 新任务标题输入区：一行输入框 + 添加按钮。
 * 内部用 useState 暂存输入内容；点按钮或按 Enter 时若非空则 onAdd，并清空输入框。
 */
const TaskInput: FC<TaskInputProps> = ({ onAdd }) => {
  const [value, setValue] = useState<string>("");

  const handleAdd = (): void => {
    const title = value.trim();
    if (title === "") {
      return;
    }
    onAdd(title);
    setValue("");
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入新任务标题"
        className="input-field min-w-0 flex-1"
        aria-label="新任务标题"
      />
      <button
        type="button"
        onClick={handleAdd}
        className="btn-primary"
      >
        <Plus className="h-5 w-5 shrink-0" aria-hidden />
        添加
      </button>
    </div>
  );
};

export default TaskInput;
