import { type FC } from "react";
import { Star } from "lucide-react";

export interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
}

const STAR_COUNT = 10;
const STAR_ICON_CLASS = "star-rating-icon";

const StarRating: FC<StarRatingProps> = ({ value, onChange, readOnly = false }) => {
  const handleSelect = (rating: number): void => {
    if (readOnly || !onChange) {
      return;
    }
    onChange(rating);
  };

  return (
    <div
      className="star-rating-control mobile-fit-control"
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
            <div key={score} className="star-rating-button">
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
            className="star-rating-button transition-all duration-300 hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
