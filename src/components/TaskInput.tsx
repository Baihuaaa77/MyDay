import { type FC, type KeyboardEventHandler, useState } from "react";
import { Plus } from "lucide-react";

export interface TaskInputProps {
  onAdd: (title: string) => void;
  placeholder?: string;
}

const TaskInput: FC<TaskInputProps> = ({
  onAdd,
  placeholder = "输入新任务标题",
}) => {
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
        placeholder={placeholder}
        className="input-field min-w-0 flex-1"
        aria-label="新任务标题"
      />
      <button type="button" onClick={handleAdd} className="btn-primary">
        <Plus className="h-5 w-5 shrink-0" aria-hidden />
        添加
      </button>
    </div>
  );
};

export default TaskInput;
