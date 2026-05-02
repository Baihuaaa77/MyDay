import { type FC } from "react";
import { Star } from "lucide-react";

/**
 * StarRating 的入参：当前分数与变更回调，由父组件持久化（如写入 DayRecord）。
 * 分值为 1～10；未选择时 value 可为 null（全部星为灰色）。
 */
export interface StarRatingProps {
  /** 当前选中的分数，1～10；未评分时为 null */
  value: number | null;
  /** 用户点击某颗星时调用，传入 1～10 的整数（readOnly 时可省略） */
  onChange?: (rating: number) => void;
  /** 为 true 时仅展示，不可点击（如历史页只读） */
  readOnly?: boolean;
}

/** 共 10 颗星，对应 1～10 分 */
const STAR_COUNT = 10;

/** 星星尺寸：窄屏略小以省宽度，宽屏恢复大星；全程单行、占满父级宽度（由 justify-between 拉开间距） */
const STAR_ICON_CLASS =
  "h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7";

/**
 * 1～10 星评分：横向排列 Star 图标，点击第 n 颗星即选择 n 分；
 * 已选中的星用黄色高亮，未选中的为灰色描边。
 * 外层 w-full + justify-between：在宽卡片里自动铺满一行；配合响应式图标尺寸，尽量避免横向滚动条。
 */
const StarRating: FC<StarRatingProps> = ({ value, onChange, readOnly }) => {
  const handleSelect = (rating: number): void => {
    if (readOnly || !onChange) {
      return;
    }
    onChange(rating);
  };

  return (
    <div
      className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-0.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-2 sm:gap-1 sm:p-3"
      role={readOnly ? "img" : "radiogroup"}
      aria-label={readOnly ? `自评分数 ${value ?? "未评分"} 分` : "自评分数，1 到 10 分"}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const score = index + 1;
        const isActive = value !== null && score <= value;

        const star = (
          <Star
            className={`${STAR_ICON_CLASS} ${
              isActive
                ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                : "fill-transparent text-slate-300"
            }`}
            strokeWidth={isActive ? 1.5 : 2}
            aria-hidden
          />
        );

        if (readOnly) {
          return (
            <div key={score} className="flex shrink-0 justify-center p-0.5">
              {star}
            </div>
          );
        }

        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} 分`}
            onClick={() => handleSelect(score)}
            className="flex shrink-0 justify-center rounded-lg p-1 transition-all duration-300 hover:scale-110 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
