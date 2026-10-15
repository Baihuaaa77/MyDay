import { type FC, type KeyboardEvent, useRef, useState } from "react";
import { Star } from "lucide-react";

export interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number | null) => void;
  readOnly?: boolean;
}

const STAR_COUNT = 10;

export function getRatingLabel(score: number | null): string {
  if (score === null) {
    return "未评分";
  }
  if (score <= 2) {
    return "很艰难";
  }
  if (score <= 4) {
    return "不太顺";
  }
  if (score <= 6) {
    return "还不错";
  }
  if (score <= 8) {
    return "很充实";
  }
  if (score === 9) {
    return "超棒的";
  }
  return "完美一天";
}

/**
 * 1～10 分自评：悬停预览分数，再次点击当前分数可清除；支持方向键调整。
 */
const StarRating: FC<StarRatingProps> = ({ value, onChange, readOnly = false }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = hovered ?? value;
  const interactive = !readOnly && onChange !== undefined;

  const select = (score: number): void => {
    onChange?.(score === value ? null : score);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, score: number): void => {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      next = Math.min(STAR_COUNT, score + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      next = Math.max(1, score - 1);
    } else if (event.key === "Home") {
      next = 1;
    } else if (event.key === "End") {
      next = STAR_COUNT;
    }
    if (next !== null) {
      event.preventDefault();
      onChange?.(next);
      buttonsRef.current[next - 1]?.focus();
    }
  };

  return (
    <div className="min-w-0">
      <div
        className="flex items-center gap-0.5 sm:gap-1"
        role={interactive ? "radiogroup" : "img"}
        aria-label={interactive ? "自评分数，1 到 10 分" : `自评 ${value ?? "未评分"} 分`}
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const score = index + 1;
          const active = shown !== null && score <= shown;
          const icon = (
            <Star
              className={`h-full w-full max-h-7 max-w-7 transition-colors duration-150 ${
                active
                  ? hovered !== null && value !== null && score > value
                    ? "fill-warm/50 text-warm/70"
                    : "fill-warm text-warm"
                  : "fill-transparent text-line-strong"
              }`}
              strokeWidth={1.75}
              aria-hidden
            />
          );

          if (!interactive) {
            return (
              <span key={score} className="star-btn pointer-events-none p-[3px]">
                {icon}
              </span>
            );
          }

          const isChecked = value === score;
          return (
            <button
              key={score}
              ref={(element) => {
                buttonsRef.current[index] = element;
              }}
              type="button"
              role="radio"
              aria-checked={isChecked}
              aria-label={`${score} 分`}
              tabIndex={isChecked || (value === null && score === 1) ? 0 : -1}
              className="star-btn p-[3px]"
              onClick={() => select(score)}
              onPointerEnter={(event) => {
                // 触屏点击也会触发 enter，只在鼠标下做悬停预览
                if (event.pointerType === "mouse") {
                  setHovered(score);
                }
              }}
              onFocus={() => setHovered(null)}
              onKeyDown={(event) => handleKeyDown(event, score)}
            >
              {icon}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="tabular text-2xl font-bold leading-none text-ink">
          {shown ?? "–"}
          <span className="ml-0.5 text-sm font-semibold text-ink-3">/10</span>
        </span>
        <span className={`text-sm font-medium ${shown === null ? "text-ink-3" : "text-ink-2"}`}>
          {getRatingLabel(shown)}
        </span>
        {interactive && value !== null && hovered === null ? (
          <button
            type="button"
            className="ml-auto text-xs font-medium text-ink-3 transition hover:text-ink-2"
            onClick={() => onChange?.(null)}
          >
            清除
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default StarRating;
