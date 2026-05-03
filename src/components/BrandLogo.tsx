import { type FC } from "react";

interface BrandLogoProps {
  className?: string;
  compactOnMobile?: boolean;
}

const BrandLogo: FC<BrandLogoProps> = ({ className, compactOnMobile = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`} aria-label="MyDay">
      <span
        className={`flex shrink-0 items-center justify-center bg-white shadow-[0_14px_30px_rgba(13,148,136,0.16)] ${
          compactOnMobile
            ? "h-10 w-10 rounded-[1.1rem] lg:h-12 lg:w-12 lg:rounded-[1.35rem]"
            : "h-12 w-12 rounded-[1.35rem]"
        }`}
      >
        <svg
          className={compactOnMobile ? "h-10 w-10 lg:h-12 lg:w-12" : "h-12 w-12"}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <rect
            x="5"
            y="5"
            width="54"
            height="54"
            rx="17"
            fill="url(#myday-icon-fill)"
          />
          <path
            d="M18.4 38.1C27.2 35.8 36.8 35.8 45.6 38.1"
            stroke="white"
            strokeWidth="3.1"
            strokeLinecap="round"
          />
          <path
            d="M23.2 34.7C23.2 29 27.1 24.4 32 24.4C36.9 24.4 40.8 29 40.8 34.7"
            stroke="white"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <path
            d="M32 18.2V14.5M24.1 21.2L21.5 18.6M19.5 30.1H15.8M39.9 21.2L42.5 18.6M44.5 30.1H48.2"
            stroke="white"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient
              id="myday-icon-fill"
              x1="10"
              y1="8"
              x2="56"
              y2="58"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#46D4CB" />
              <stop offset="0.56" stopColor="#1FBFAE" />
              <stop offset="1" stopColor="#0E9F93" />
            </linearGradient>
          </defs>
        </svg>
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
