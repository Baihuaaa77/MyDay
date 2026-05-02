import { type FC, useEffect, useState } from "react";
import { MOOD_OPTIONS, getMoodById } from "../data/moods";

/**
 * MoodPicker 的入参：
 * - value: 当前已选中的 moodId（null 表示未选）
 * - onChange: 用户选择后回调，传入 moodId
 * - readOnly: 只读模式，仅展示已选 emoji 不可点击
 */
export interface MoodPickerProps {
  value: string | null;
  onChange?: (moodId: string) => void;
  readOnly?: boolean;
}

/**
 * 每日状态 emoji 选择器 —— 本工具的核心「卖点」组件。
 *
 * 未选择时：展示 10 个小 emoji 供选择，鼠标悬停时显示文字解读（Tooltip）。
 * 已选择时：被选中的 emoji 放大展示在中央，伴随弹跳动画；
 *          下方仍保留小选择器可以切换。
 * readOnly 模式：仅展示已选 emoji 大图，不显示选择器。
 */
const MoodPicker: FC<MoodPickerProps> = ({ value, onChange, readOnly }) => {
  const selectedMood = getMoodById(value);

  /**
   * animatingId 用于触发选中时的弹跳动画。
   * 每次用户点击一个 emoji 时把它的 id 存入，动画结束后清除。
   * 类比 Python：就像设一个临时 flag 控制动画播放。
   */
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
    onChange(moodId);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* 已选中的 emoji 大图展示区 */}
      <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-slate-200/70 bg-slate-50/80 shadow-inner sm:h-36 sm:w-36">
        {selectedMood ? (
          <div className="flex flex-col items-center gap-2">
            <span
              className={`text-7xl leading-none sm:text-8xl ${
                animatingId === selectedMood.id ? "animate-mood-bounce" : "animate-mood-float"
              }`}
              role="img"
              aria-label={selectedMood.label}
            >
              {selectedMood.emoji}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              {selectedMood.label}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-6xl leading-none text-slate-200 sm:text-7xl">
              ?
            </span>
            <span className="px-3 text-center text-xs font-medium text-slate-400">
              {readOnly ? "未选择状态" : "选一个代表今天的状态吧"}
            </span>
          </div>
        )}
      </div>

      {/* emoji 选择器：10 个小图标横排，悬停显示 tooltip */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = value === mood.id;
            return (
              <div key={mood.id} className="group relative">
                <button
                  type="button"
                  onClick={() => handleSelect(mood.id)}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:h-14 sm:w-14 sm:text-3xl ${
                    isSelected
                      ? "scale-110 bg-white shadow-md ring-2 ring-teal-500"
                      : "border border-slate-200/70 bg-slate-50/80 hover:scale-110 hover:bg-white hover:shadow-md"
                  }`}
                  aria-label={mood.label}
                  aria-pressed={isSelected}
                >
                  <span className={isSelected ? "" : "transition-transform duration-300 group-hover:scale-125"}>
                    {mood.emoji}
                  </span>
                </button>

                {/* Tooltip：纯 CSS 实现，悬停时从下方淡入 */}
                <div
                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-100"
                  role="tooltip"
                >
                  {mood.label}
                  {/* 小三角箭头 */}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-teal-700" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MoodPicker;
