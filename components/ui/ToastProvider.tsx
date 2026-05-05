"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";
type ToastPosition = "top" | "bottom";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  position: ToastPosition;
};

type ToastContextValue = {
  push: (
    message: string,
    variant?: ToastVariant,
    options?: { position?: ToastPosition }
  ) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

const variantClasses: Record<ToastVariant, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-foreground",
  error: "border-rose-500/40 bg-rose-500/10 text-foreground",
  info: "border-border bg-card text-foreground",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      options?: { position?: ToastPosition }
    ) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const position = options?.position || "top";
      setToasts((prev) => {
        const next = [...prev, { id, message, variant, position }];
        return next.length > 4 ? next.slice(-4) : next;
      });
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3000);
    },
    []
  );

  const topToasts = toasts.filter((toast) => toast.position === "top");
  const bottomToasts = toasts.filter((toast) => toast.position === "bottom");

  const renderToast = (toast: Toast) => (
    <div
      key={toast.id}
      className={cn(
        "pointer-events-auto w-auto max-w-[90vw] rounded-xl border px-4 py-3 text-sm shadow-soft backdrop-blur",
        "break-words",
        "border-l-4",
        variantClasses[toast.variant]
      )}
    >
      {toast.message}
    </div>
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        data-toast-root
        className="pointer-events-none fixed left-1/2 top-4 z-[100] flex -translate-x-1/2 flex-col items-center space-y-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {topToasts.map(renderToast)}
      </div>
      <div
        data-toast-root
        className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center space-y-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {bottomToasts.map(renderToast)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
