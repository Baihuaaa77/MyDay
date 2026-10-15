import { type FC } from "react";

interface BrandLogoProps {
  className?: string;
}

const BrandLogo: FC<BrandLogoProps> = ({ className }) => (
  <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
    <img
      className="h-9 w-9 shrink-0 rounded-[0.7rem] shadow-sm"
      src={`${import.meta.env.BASE_URL}myday-icon-192-v2.png`}
      width={36}
      height={36}
      alt=""
      aria-hidden
    />
    <span className="text-lg font-extrabold tracking-tight text-ink">MyDay</span>
  </div>
);

export default BrandLogo;
