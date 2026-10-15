import {
  type ClipboardEvent,
  type KeyboardEvent,
  forwardRef,
  useState,
} from "react";
import { CornerDownLeft, Plus } from "lucide-react";

export interface TaskInputProps {
  onAdd: (titles: string[]) => void;
  placeholder?: string;
}

/** 输入法组字过程中按下的回车不应提交（中文输入时非常常见） */
export function isComposingEnter(event: KeyboardEvent<HTMLElement>): boolean {
  return event.nativeEvent.isComposing || event.keyCode === 229;
}

/** 把粘贴的多行清单拆成多条任务，去掉常见的列表前缀 */
function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•·]|\d+[.)、]|\[[ xX]?\])\s*/, "").trim())
    .filter((line) => line !== "");
}

const TaskInput = forwardRef<HTMLInputElement, TaskInputProps>(
  ({ onAdd, placeholder = "添加一个任务…" }, ref) => {
    const [value, setValue] = useState<string>("");

    const submit = (): void => {
      const title = value.trim();
      if (title === "") {
        return;
      }
      onAdd([title]);
      setValue("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === "Enter" && !isComposingEnter(event)) {
        event.preventDefault();
        submit();
      } else if (event.key === "Escape") {
        setValue("");
        event.currentTarget.blur();
      }
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>): void => {
      const lines = splitLines(event.clipboardData.getData("text"));
      if (lines.length > 1) {
        event.preventDefault();
        onAdd(lines);
      }
    };

    const hasValue = value.trim() !== "";

    return (
      <div className="group relative flex items-center">
        <Plus
          className="pointer-events-none absolute left-3.5 h-5 w-5 text-ink-3 transition-colors group-focus-within:text-brand"
          aria-hidden
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          enterKeyHint="done"
          maxLength={200}
          className="input h-12 pl-11 pr-14"
          aria-label="新任务标题"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!hasValue}
          className={`absolute right-1.5 flex h-9 w-10 items-center justify-center rounded-lg transition-all duration-200 ${
            hasValue
              ? "bg-brand text-brand-ink shadow-brand"
              : "pointer-events-none text-ink-3 opacity-0 sm:opacity-100"
          }`}
          aria-label="添加任务"
        >
          <CornerDownLeft className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  },
);

TaskInput.displayName = "TaskInput";

export default TaskInput;
