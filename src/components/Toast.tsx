import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const iconBg = {
    success: 'bg-success-500',
    error: 'bg-danger-500',
    warning: 'bg-warning-500',
    info: '',
  };
  
  const iconBgStyle = toast.type === 'info' ? { backgroundColor: THEME_COLOR } : undefined;

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-white" />,
    error: <XCircle className="w-4 h-4 text-white" />,
    warning: <AlertTriangle className="w-4 h-4 text-white" />,
    info: <Info className="w-4 h-4 text-white" />,
  };

  const bgColors = {
    success: 'bg-gradient-to-r from-success-50 to-success-100/80 border-success-200/50',
    error: 'bg-gradient-to-r from-danger-50 to-danger-100/80 border-danger-200/50',
    warning: 'bg-gradient-to-r from-warning-50 to-warning-100/80 border-warning-200/50',
    info: 'border',
  };
  
  const infoBgStyle = { 
    background: `linear-gradient(to right, ${withOpacity(THEME_COLOR, 0.1)}, ${withOpacity(THEME_COLOR, 0.15)})`,
    borderColor: withOpacity(THEME_COLOR, 0.3)
  };

  const textColors = {
    success: 'text-success-800',
    error: 'text-danger-800',
    warning: 'text-warning-800',
    info: '',
  };
  
  const infoTextStyle = { color: THEME_COLOR_DARK };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-lg backdrop-blur-sm ${bgColors[toast.type]} animate-slide-in`}
      style={toast.type === 'info' ? infoBgStyle : undefined}
      role="alert"
    >
      <div 
        className={`p-1.5 rounded-lg ${iconBg[toast.type]}`}
        style={toast.type === 'info' ? { backgroundColor: THEME_COLOR } : undefined}
      >
        {icons[toast.type]}
      </div>
      <span 
        className={`text-sm font-medium flex-1 ${textColors[toast.type]}`}
        style={toast.type === 'info' ? infoTextStyle : undefined}
      >{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 hover:bg-neutral-100 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = `toast-${++toastIdRef.current}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
