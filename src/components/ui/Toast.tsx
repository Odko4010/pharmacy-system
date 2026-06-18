"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import clsx from "clsx";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface ToastContextValue {
  showToast: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "flex items-start gap-2.5 rounded-lg px-4 py-3 shadow-lg text-sm font-medium animate-in",
              toast.type === "success"
                ? "bg-[var(--color-success)] text-white"
                : "bg-[var(--color-danger)] text-white"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="size-5 shrink-0 mt-0.5" />
            )}
            <p className="flex-1">{toast.message}</p>
            <button onClick={() => dismiss(toast.id)} aria-label="Хаах">
              <X className="size-4 opacity-80 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast нь ToastProvider дотор ашиглагдах ёстой");
  return context;
}
