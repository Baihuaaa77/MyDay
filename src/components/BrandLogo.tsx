import { type FC } from "react";

interface BrandLogoProps {
  className?: string;
  compactOnMobile?: boolean;
}

const BrandLogo: FC<BrandLogoProps> = ({ className, compactOnMobile = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`} aria-label="MyDay">
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden ${
          compactOnMobile
            ? "h-10 w-10 rounded-[1.1rem] lg:h-12 lg:w-12 lg:rounded-[1.35rem]"
            : "h-12 w-12 rounded-[1.35rem]"
        }`}
      >
        <img
          className="h-full w-full"
          src={`${import.meta.env.BASE_URL}myday-icon-1024.png`}
          alt=""
          aria-hidden
        />
      </span>
      <div className="min-w-0">
        <p
          className={`font-extrabold leading-none tracking-tight text-slate-800 ${
            compactOnMobile ? "text-xl lg:text-[1.55rem]" : "text-[1.55rem]"
          }`}
        >
          MyDay
        </p>
      </div>
    </div>
  );
};

export default BrandLogo;
