import { type FC, useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { MOOD_OPTIONS, getMoodById } from "../data/moods";

export interface MoodPickerProps {
  value: string | null;
  onChange?: (moodId: string) => void;
  readOnly?: boolean;
  emptyLabel?: string;
}

const MoodPicker: FC<MoodPickerProps> = ({
  value,
  onChange,
  readOnly = false,
  emptyLabel = "选一个代表今天的状态吧",
}) => {
  const selectedMood = getMoodById(value);
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    if (animatingId === null) {
      return;
    }
    const timer = setTimeout(() => setAnimatingId(null), 600);
    return () => clearTimeout(timer);
  }, [animatingId]);

  const handleSelect = (moodId: string): void => {
    if (readOnly || !onChange) {
      return;
    }
    setAnimatingId(moodId);
    setIsOpen(false);
    onChange(moodId);
  };

  return (
    <div
      className="group/mood mobile-fit-control relative min-w-0 max-w-md"
      onMouseEnter={() => !readOnly && setIsOpen(true)}
      onMouseLeave={() => !readOnly && setIsOpen(false)}
    >
      <button
        type="button"
        disabled={readOnly}
        aria-expanded={!readOnly && isOpen}
        aria-controls={listId}
        onClick={() => !readOnly && setIsOpen((open) => !open)}
        onFocus={() => !readOnly && setIsOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-left shadow-inner transition-all duration-300 hover:border-cyan-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 disabled:cursor-default disabled:hover:border-slate-200/80 disabled:hover:bg-slate-50/80 sm:gap-4 sm:p-5"
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white bg-white text-center shadow-sm sm:h-24 sm:w-24 sm:rounded-[1.5rem]">
          {selectedMood ? (
            <span
              className={`text-4xl leading-none sm:text-6xl ${
                animatingId === selectedMood.id ? "animate-mood-bounce" : "animate-mood-float"
              }`}
              role="img"
              aria-label={selectedMood.label}
            >
              {selectedMood.emoji}
            </span>
          ) : (
            <span className="text-4xl leading-none text-slate-200 sm:text-6xl">?</span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900 sm:text-base">
            {selectedMood ? selectedMood.label : "还没有选择状态"}
          </span>
          <span className="mt-1 block text-sm leading-5 text-slate-500 sm:leading-6">
            {readOnly ? "这一天没有记录状态" : selectedMood ? "点击或悬浮这里切换状态" : emptyLabel}
          </span>
        </span>

        {!readOnly && (
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        )}
      </button>

      {!readOnly && (
        <div
          id={listId}
          className={`overflow-hidden transition-all duration-300 ${
            isOpen
              ? "max-h-40 translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-2 opacity-0"
          }`}
        >
          <div className="mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-lg sm:gap-3 sm:p-3">
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = value === mood.id;
              return (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => handleSelect(mood.id)}
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 sm:h-14 sm:w-14 sm:text-3xl ${
                    isSelected
                      ? "scale-105 bg-cyan-50 shadow-sm ring-2 ring-[#10aab2]"
                      : "border border-slate-200/70 bg-slate-50/80 hover:scale-105 hover:bg-white hover:shadow-md"
                  }`}
                  aria-label={mood.label}
                  aria-pressed={isSelected}
                  title={mood.label}
                >
                  {mood.emoji}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodPicker;
