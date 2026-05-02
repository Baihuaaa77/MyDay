import { type ChangeEventHandler, type FC } from "react";

export interface DailyNoteProps {
  value: string;
  onChange?: (note: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

const DailyNote: FC<DailyNoteProps> = ({
  value,
  onChange,
  readOnly = false,
  placeholder = "写下今天想留下的内容",
  ariaLabel = "当日记录",
}) => {
  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    onChange?.(e.target.value);
  };

  return (
    <textarea
      value={value}
      readOnly={readOnly}
      onChange={readOnly ? undefined : handleChange}
      placeholder={readOnly ? undefined : placeholder}
      rows={6}
      className={
        readOnly
          ? "w-full resize-none rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-base leading-relaxed text-slate-800"
          : "input-field min-h-44 resize-y"
      }
      aria-label={ariaLabel}
    />
  );
};

export default DailyNote;
