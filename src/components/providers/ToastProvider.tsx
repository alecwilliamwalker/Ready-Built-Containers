"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ description, title, variant = "info", duration = 5000 }: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, description, title, variant, duration }]);

      if (duration > 0) {
        setTimeout(() => dismissToast(id), duration);
      }
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {isMounted && typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={clsx(
                  "pointer-events-auto rounded-lg border px-4 py-3 shadow-lg backdrop-blur",
                  toast.variant === "success" && "border-emerald-700/40 bg-emerald-950/70 text-emerald-100",
                  toast.variant === "error" && "border-red-700/40 bg-red-950/70 text-red-100",
                  toast.variant === "info" && "border-muted/30 bg-surface text-muted",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
                    {toast.description && <p className="text-sm opacity-80">{toast.description}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="text-xs font-medium uppercase tracking-wide opacity-60 transition hover:opacity-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

