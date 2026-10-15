import {
  type FC,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** 毫秒，默认 4000 */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

type ShowToast = (options: ToastOptions) => void;

const ToastContext = createContext<ShowToast>(() => undefined);

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

const ToastView: FC<{ toast: ToastItem; onClose: (id: number) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => onClose(toast.id), toast.duration ?? 4000);
    return () => window.clearTimeout(timer);
  }, [onClose, toast.duration, toast.id]);

  return (
    <div className="toast" role="status">
      <span className="min-w-0 flex-1 truncate">{toast.message}</span>
      {toast.actionLabel !== undefined && toast.onAction !== undefined ? (
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 text-sm font-bold text-brand transition hover:bg-white/10"
          onClick={() => {
            toast.onAction?.();
            onClose(toast.id);
          }}
        >
          {toast.actionLabel}
        </button>
      ) : null}
      <button
        type="button"
        className="-mr-1 shrink-0 rounded-md p-1 opacity-60 transition hover:opacity-100"
        onClick={() => onClose(toast.id)}
        aria-label="关闭提示"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
};

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const close = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback<ShowToast>((options) => {
    const id = nextIdRef.current++;
    // 最多同时显示 2 条，新的在下
    setToasts((prev) => [...prev.slice(-1), { ...options, id }]);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <ToastView key={toast.id} toast={toast} onClose={close} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
