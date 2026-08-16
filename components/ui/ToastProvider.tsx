"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";
type ToastPosition = "top" | "bottom";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  position: ToastPosition;
  closing?: boolean;
};

type ToastContextValue = {
  push: (
    message: string,
    variant?: ToastVariant,
    options?: { position?: ToastPosition }
  ) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

const MAX_VISIBLE = 3;
const BASE_DURATION = 4000;
const CHARS_PER_MS = 12;
const MIN_DURATION = 3000;
const MAX_DURATION = 8000;
const EXIT_ANIMATION_MS = 300;

function getDuration(message: string, variant: ToastVariant): number {
  if (variant === "error" || variant === "warning") {
    return Math.min(MAX_DURATION, Math.max(6000, BASE_DURATION + message.length * CHARS_PER_MS));
  }
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, BASE_DURATION + message.length * CHARS_PER_MS));
}

const variantConfig: Record<ToastVariant, {
  icon: React.ElementType;
  ariaRole: "status" | "alert";
  iconColor: string;
  borderClass: string;
}> = {
  success: {
    icon: CheckCircle,
    ariaRole: "status",
    iconColor: "text-emerald-500",
    borderClass: "border-l-[3px] border-l-emerald-500",
  },
  error: {
    icon: XCircle,
    ariaRole: "alert",
    iconColor: "text-red-500",
    borderClass: "border-l-[3px] border-l-red-500",
  },
  warning: {
    icon: AlertTriangle,
    ariaRole: "alert",
    iconColor: "text-amber-500",
    borderClass: "border-l-[3px] border-l-amber-500",
  },
  info: {
    icon: Info,
    ariaRole: "status",
    iconColor: "text-blue-500",
    borderClass: "border-l-[3px] border-l-blue-500",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timersRef = React.useRef<Map<string, { timer: ReturnType<typeof setTimeout>; remaining: number; pausedAt: number | null }>>(new Map());

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    timersRef.current.delete(id);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    const entry = timersRef.current.get(id);
    if (entry) {
      clearTimeout(entry.timer);
    }
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
    );
    setTimeout(() => removeToast(id), EXIT_ANIMATION_MS);
  }, [removeToast]);

  const scheduleDismiss = React.useCallback(
    (id: string, message: string, variant: ToastVariant) => {
      const duration = getDuration(message, variant);
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, { timer, remaining: duration, pausedAt: null });
    },
    [dismiss]
  );

  const pauseTimer = React.useCallback((id: string) => {
    const entry = timersRef.current.get(id);
    if (!entry || entry.pausedAt) return;
    clearTimeout(entry.timer);
    const now = Date.now();
    entry.remaining = Math.max(1000, entry.remaining - (now - (entry.pausedAt ?? now)));
    entry.pausedAt = now;
    timersRef.current.set(id, entry);
  }, []);

  const resumeTimer = React.useCallback((id: string) => {
    const entry = timersRef.current.get(id);
    if (!entry || !entry.pausedAt) return;
    const elapsed = Date.now() - entry.pausedAt;
    entry.remaining = Math.max(1000, entry.remaining - elapsed);
    entry.pausedAt = null;
    const timer = setTimeout(() => dismiss(id), entry.remaining);
    entry.timer = timer;
    timersRef.current.set(id, entry);
  }, [dismiss]);

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
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });

      scheduleDismiss(id, message, variant);
    },
    [scheduleDismiss]
  );

  React.useEffect(() => {
    return () => {
      timersRef.current.forEach((entry) => clearTimeout(entry.timer));
    };
  }, []);

  const topToasts = toasts.filter((t) => t.position === "top");
  const bottomToasts = toasts.filter((t) => t.position === "bottom");

  const renderToast = (toast: Toast) => {
    const config = variantConfig[toast.variant];
    const Icon = config.icon;

    return (
      <div
        key={toast.id}
        role={config.ariaRole}
        aria-live={config.ariaRole === "alert" ? "assertive" : "polite"}
        aria-atomic="true"
        data-state={toast.closing ? "closing" : "open"}
        className={cn(
          "toast-item group/toast pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900",
          "text-sm text-zinc-900 dark:text-zinc-100",
          config.borderClass
        )}
        onMouseEnter={() => pauseTimer(toast.id)}
        onMouseLeave={() => resumeTimer(toast.id)}
        onFocus={() => pauseTimer(toast.id)}
        onBlur={() => resumeTimer(toast.id)}
        tabIndex={0}
      >
        {/* Icon */}
        <Icon
          size={18}
          className={cn("shrink-0", config.iconColor)}
          aria-hidden="true"
        />

        {/* Content */}
        <p className="min-w-0 flex-1 pr-5 leading-snug">{toast.message}</p>

        {/* Close button — top-right corner, visible on hover (always on touch) */}
        <button
          type="button"
          onClick={() => dismiss(toast.id)}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors",
            "opacity-0 group-hover/toast:opacity-100",
            "hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
            "focus:outline-none focus:ring-2 focus:ring-zinc-400/30",
            /* Always visible on touch devices */
            "[@media(hover:none)]:opacity-100"
          )}
          aria-label="Dismiss"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    );
  };

  const renderContainer = (
    toasts: Toast[],
    position: "top" | "bottom"
  ) => {
    if (toasts.length === 0) return null;

    return (
      <div
        data-toast-root
        className={cn(
          "pointer-events-none fixed z-[200] flex flex-col gap-2",
          "w-full max-w-sm px-4",
          position === "top" ? "top-4 right-0 items-end" : "bottom-4 right-0 items-end"
        )}
        aria-relevant="additions removals"
      >
        {toasts.map((toast) => renderToast(toast))}
      </div>
    );
  };

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      {renderContainer(topToasts, "top")}
      {renderContainer(bottomToasts, "bottom")}
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
