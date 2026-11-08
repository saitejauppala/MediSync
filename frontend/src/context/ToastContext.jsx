import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 4500;

const ToastIcon = ({ type }) => {
  if (type === 'error') return <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />;
  if (type === 'info') return <Info aria-hidden="true" className="h-5 w-5 shrink-0" />;
  return <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message, type = 'success') => {
    if (!message) return;

    const id = ++nextId.current;
    setToasts((current) => [...current, { id, message, type }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), TOAST_DURATION_MS));
  }, [dismiss]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`app-toast app-toast--${toast.type}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <ToastIcon type={toast.type} />
            <p className="min-w-0 flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="app-toast__dismiss"
              aria-label="Dismiss notification"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error('useToast must be used within a ToastProvider');
  return notify;
};
