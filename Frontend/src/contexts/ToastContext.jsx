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

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {messages.map((toast) => (
          <div
            key={toast.id}
            className={`app-toast app-toast-${toast.tone}`}
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
