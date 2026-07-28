import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

type ToastTone = 'success' | 'danger' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
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
          <div key={toast.id} className={`app-toast app-toast-${toast.tone}`} role="status">
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
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}
