import { type FC, type MouseEvent } from "react";

/**
 * 确认弹层：固定遮罩 + 居中卡片，替代浏览器原生 confirm（项目规则禁止 alert/confirm）。
 * 类比：在桌面应用里常见的「模态对话框」，焦点锁在这一层直到用户点确定或取消。
 */
export interface ConfirmDialogProps {
  /** 是否显示（为 false 时不渲染交互层，避免占焦点） */
  open: boolean;
  /** 标题 */
  title: string;
  /** 说明正文 */
  message: string;
  /** 确认按钮文案，默认「确定」 */
  confirmLabel?: string;
  /** 取消按钮文案，默认「取消」 */
  cancelLabel?: string;
  /** 用户点击确认 */
  onConfirm: () => void;
  /** 用户点击取消或关闭 */
  onCancel: () => void;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = "确定",
  cancelLabel = "取消",
  onConfirm,
  onCancel,
}) => {
  if (!open) {
    return null;
  }

  const handleBackdropClick = (): void => {
    onCancel();
  };

  const handleCardClick = (e: MouseEvent<HTMLDivElement>): void => {
    // 阻止点击卡片内部时冒泡到遮罩，避免误关
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/80 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)] backdrop-blur-xl transition-all duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={handleCardClick}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-950">
          {title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary px-4 py-2"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
