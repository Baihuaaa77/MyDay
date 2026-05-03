import { type FC, type ReactNode } from "react";
import { X } from "lucide-react";

export interface MobileBottomSheetProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}

const MobileBottomSheet: FC<MobileBottomSheetProps> = ({
  open,
  title,
  description,
  children,
  onClose,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="mobile-sheet-backdrop lg:hidden" data-swipe-lock="true">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="关闭面板"
        onClick={onClose}
      />
      <section
        className="mobile-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-sheet-title"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" aria-hidden />
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="mobile-sheet-title" className="text-lg font-bold text-slate-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
            ) : null}
          </div>
          <button type="button" className="icon-button h-10 w-10" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="mobile-sheet-content">{children}</div>
      </section>
    </div>
  );
};

export default MobileBottomSheet;
