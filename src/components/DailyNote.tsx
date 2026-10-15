import { type FC, useLayoutEffect, useRef } from "react";
import { Check, CloudOff, Loader2 } from "lucide-react";
import type { SaveState } from "../hooks/useDayRecordEditor";

export interface DailyNoteProps {
  value: string;
  onChange?: (note: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  saveState?: SaveState;
  /** 点击后插入到备注末尾的书写提示 */
  prompts?: readonly string[];
}

const MIN_HEIGHT = 144;

const SaveIndicator: FC<{ state: SaveState }> = ({ state }) => {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-ink-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        保存中
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-brand-strong">
        <Check className="h-3.5 w-3.5" aria-hidden />
        已保存
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-danger">
        <CloudOff className="h-3.5 w-3.5" aria-hidden />
        保存失败
      </span>
    );
  }
  return <span className="text-ink-3">自动保存</span>;
};

const DailyNote: FC<DailyNoteProps> = ({
  value,
  onChange,
  readOnly = false,
  placeholder = "写下今天想留下的内容",
  ariaLabel = "当日记录",
  saveState = "idle",
  prompts = [],
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 随内容自动增高，免去在小框里来回滚动
  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (element === null) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.max(MIN_HEIGHT, element.scrollHeight + 2)}px`;
  }, [value]);

  const insertPrompt = (prompt: string): void => {
    const prefix = value === "" || value.endsWith("\n") ? "" : "\n";
    const next = `${value}${prefix}${prompt}：`;
    onChange?.(next);
    requestAnimationFrame(() => {
      const element = textareaRef.current;
      if (element !== null) {
        element.focus();
        element.setSelectionRange(next.length, next.length);
      }
    });
  };

  if (readOnly) {
    return value.trim() === "" ? (
      <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-ink-3">这一天没有留下记录。</p>
    ) : (
      <p className="whitespace-pre-wrap break-words rounded-xl bg-surface-2 px-4 py-3 text-[15px] leading-7 text-ink">
        {value}
      </p>
    );
  }

  const length = Array.from(value).length;

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="input block resize-none px-4 py-3 leading-7"
        style={{ minHeight: MIN_HEIGHT }}
        aria-label={ariaLabel}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {prompts.map((prompt) => (
          <button key={prompt} type="button" className="chip" onClick={() => insertPrompt(prompt)}>
            + {prompt}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-3 font-medium">
          {length > 0 ? <span className="tabular text-ink-3">{length} 字</span> : null}
          <SaveIndicator state={saveState} />
        </span>
      </div>
    </div>
  );
};

export default DailyNote;
