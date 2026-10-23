import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const COLORS = {
  success: 'text-success-light',
  error:   'text-emergency-light',
  warning: 'text-warning-light',
  info:    'text-info-light',
};

let toastId = 0;

/**
 * ToastProvider — wraps the app and renders toasts in fixed position
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error',   dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info:    (msg, dur) => addToast(msg, 'info',    dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(({ id, message, type }) => {
          const Icon = ICONS[type];
          const color = COLORS[type];
          return (
            <div key={id} className={`toast toast-${type} pointer-events-auto`}>
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
              <p className="text-sm text-gray-200 flex-1">{message}</p>
              <button
                onClick={() => dismiss(id)}
                className="text-gray-500 hover:text-gray-300 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * useToast hook — access the toast API anywhere
 * Usage: const toast = useToast(); toast.success('Done!');
 */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

export default ToastProvider;
