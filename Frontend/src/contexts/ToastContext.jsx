import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(undefined);

export function ToastProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const notify = useCallback((message, tone = "info") => {
    const id = crypto.randomUUID();
    setMessages((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setMessages((current) => current.filter((toast) => toast.id !== id));
    }, 4_000);
  }, []);

  const toneClass = {
    info: "border-l-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
    success: "border-l-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
    danger: "border-l-red-500 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300",
    warning: "border-l-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
  };

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[1080] grid gap-3 max-w-sm" aria-live="polite" aria-atomic="true">
        {messages.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium shadow-lg border-l-4 animate-in slide-in-from-right ${toneClass[toast.tone] ?? toneClass.info}`}
            role="status"
          >
            {toast.message}
          </div>
        ))}
      </div>
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
