import { type FC, useState } from "react";
import { MOOD_OPTIONS, getMoodById } from "../data/moods";

export interface MoodPickerProps {
  value: string | null;
  onChange?: (moodId: string | null) => void;
  readOnly?: boolean;
}

/**
 * 状态选择：7 个 emoji 平铺，一次点击即可完成；再次点击已选项可取消。
 */
const MoodPicker: FC<MoodPickerProps> = ({ value, onChange, readOnly = false }) => {
  const [justPicked, setJustPicked] = useState<string | null>(null);
  const selected = getMoodById(value);

  if (readOnly) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
        <span className="text-2xl leading-none" aria-hidden>
          {selected?.emoji ?? "·"}
        </span>
        <span className="text-sm font-medium text-ink-2">{selected?.label ?? "没有记录状态"}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-1.5" role="radiogroup" aria-label="选择当天状态">
      {MOOD_OPTIONS.map((mood) => {
        const isSelected = value === mood.id;
        const dimmed = value !== null && !isSelected;
        return (
          <button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={mood.label}
            title={isSelected ? `${mood.label}（再次点击取消）` : mood.label}
            onClick={() => {
              setJustPicked(isSelected ? null : mood.id);
              onChange?.(isSelected ? null : mood.id);
            }}
            className={`group flex min-w-0 flex-col items-center gap-1 rounded-xl border px-0.5 py-2 transition-all duration-200 ${
              isSelected
                ? "border-brand/50 bg-brand-soft shadow-sm"
                : "border-transparent hover:bg-surface-2"
            }`}
          >
            <span
              className={`text-[26px] leading-none transition-all duration-200 sm:text-[28px] ${
                dimmed ? "opacity-45 grayscale-[40%] group-hover:opacity-100 group-hover:grayscale-0" : ""
              } ${isSelected && justPicked === mood.id ? "animate-pop-in" : ""} ${
                isSelected ? "scale-110" : "group-hover:scale-110"
              }`}
              aria-hidden
            >
              {mood.emoji}
            </span>
            <span
              className={`truncate text-[11px] font-semibold ${
                isSelected ? "text-brand-strong" : "text-ink-3"
              }`}
            >
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MoodPicker;
