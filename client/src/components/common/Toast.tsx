import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_STYLES: Record<ToastType, string> = {
  info: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-amber-500',
  error: 'bg-red-600',
};

function ToastItem({ message, type, onClose }: Readonly<{ message: string; type: ToastType; onClose: () => void }>) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${TOAST_STYLES[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}
      role="alert"
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-white/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
}

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
