import { type FC, type ChangeEventHandler } from "react";

/**
 * DailyNote 的入参：受控组件模式——内容由父组件 state 持有，便于与 DayRecord.note 同步。
 */
export interface DailyNoteProps {
  /** 文本框当前内容（对应今日记录 / DayRecord.note） */
  value: string;
  /** 内容变化时调用；只读模式下可不传 */
  onChange?: (note: string) => void;
  /** 为 true 时不可编辑（如历史页只读） */
  readOnly?: boolean;
}

/**
 * 多行文本输入，用于写「今日记录」类备注。
 * 使用 Tailwind 做成圆角、浅色边框的文本区域，与页面卡片风格一致。
 */
const DailyNote: FC<DailyNoteProps> = ({ value, onChange, readOnly }) => {
  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    onChange?.(e.target.value);
  };

  return (
    <textarea
      value={value}
      readOnly={readOnly}
      onChange={readOnly ? undefined : handleChange}
      placeholder={readOnly ? undefined : "今天做了点啥？"}
      rows={5}
      className={
        readOnly
          ? "w-full resize-none rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-base leading-relaxed text-slate-800"
          : "input-field min-h-36 resize-y"
      }
      aria-label="今日记录"
    />
  );
};

export default DailyNote;
