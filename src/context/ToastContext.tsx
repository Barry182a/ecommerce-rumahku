'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  open: boolean;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({
      open: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 2500);
  }, []);

  const handleClose = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const toastStyle = {
    wrapper: 'border border-green-500 bg-green-500 text-white',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-24 z-[9999] flex justify-center px-4">
        {toast.open && (
          <div
            className={`pointer-events-auto flex w-fit min-w-[260px] max-w-[90vw] items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg transition-all ${toastStyle.wrapper}`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast harus digunakan di dalam ToastProvider');
  }
  return context;
}