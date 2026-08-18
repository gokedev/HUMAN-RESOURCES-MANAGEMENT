import { useState, useEffect, useCallback, createContext, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(undefined);
const MAX_VISIBLE = 5;

const variantConfig = {
  info: {
    icon: Info,
    container: "border-blue-200 bg-white text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
    iconClass: "text-blue-500 dark:text-blue-400",
    progress: "bg-blue-500",
  },
  success: {
    icon: CheckCircle2,
    container: "border-emerald-200 bg-white text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
    iconClass: "text-emerald-500 dark:text-emerald-400",
    progress: "bg-emerald-500",
  },
  danger: {
    icon: XCircle,
    container: "border-red-200 bg-white text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200",
    iconClass: "text-red-500 dark:text-red-400",
    progress: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    container: "border-amber-200 bg-white text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
    iconClass: "text-amber-500 dark:text-amber-400",
    progress: "bg-amber-500",
  },
};

function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const config = variantConfig[toast.variant] ?? variantConfig.info;
  const Icon = config.icon;
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    const start = Date.now();
    let raf;
    function tick() {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        raf = requestAnimationFrame(tick);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <div
      className={cn(
        "group relative w-full max-w-sm overflow-hidden rounded-xl border shadow-lg",
        "animate-in slide-in-from-right-full fade-in duration-300",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-full data-[swipe=end]:transition-transform data-[swipe=end]:duration-200",
        config.container
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconClass)} />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-sm font-semibold leading-none mb-1">{toast.title}</p>
          )}
          <p className="text-sm opacity-90 leading-snug">{toast.message}</p>
          {toast.description && (
            <p className="text-xs opacity-70 mt-1 leading-snug">{toast.description}</p>
          )}
          {toast.action && (
            <button
              className="mt-2 text-xs font-semibold underline underline-offset-2 opacity-90 hover:opacity-100 transition-opacity"
              onClick={() => {
                toast.action.onClick();
                onDismiss(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          className="shrink-0 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5 dark:hover:bg-white/5"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-[3px] w-full bg-black/5 dark:bg-white/10">
        <div
          className={cn("h-full transition-none rounded-full", config.progress)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, message, description, variant = "info", duration = 5000, action }) => {
      const id = crypto.randomUUID();
      const toast = {
        id,
        title,
        message: typeof arguments[0] === "string" ? arguments[0] : message,
        description,
        variant: typeof arguments[1] === "string" ? arguments[1] : variant,
        duration,
        action,
      };
      // Support old-style: notify("message", "tone")
      if (typeof arguments[0] === "string") {
        toast.message = arguments[0];
        toast.variant = arguments[1] ?? "info";
        toast.title = undefined;
        toast.description = undefined;
      }
      setToasts((current) => {
        const next = [...current, toast];
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });
    },
    []
  );

  const value = useMemo(() => ({ notify, dismiss, toast: notify }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="fixed right-4 top-4 z-[1080] flex flex-col gap-3 pointer-events-none"
          aria-live="polite"
          aria-atomic="true"
        >
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
