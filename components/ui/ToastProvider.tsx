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
  className: string;
  iconClassName: string;
}> = {
  success: {
    icon: CheckCircle,
    ariaRole: "status",
    className: "border-success/30 bg-success/8 text-foreground",
    iconClassName: "text-success",
  },
  error: {
    icon: XCircle,
    ariaRole: "alert",
    className: "border-destructive/30 bg-destructive/8 text-foreground",
    iconClassName: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    ariaRole: "alert",
    className: "border-warning/30 bg-warning/8 text-foreground",
    iconClassName: "text-warning",
  },
  info: {
    icon: Info,
    ariaRole: "status",
    className: "border-primary/20 bg-primary/5 text-foreground",
    iconClassName: "text-primary",
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
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
    );
    // Remove after animation
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
    const elapsed = Date.now() - (entry.pausedAt ?? Date.now());
    entry.pausedAt = Date.now();
    entry.remaining = Math.max(1000, entry.remaining - elapsed);
    timersRef.current.set(id, entry);
  }, []);

  const resumeTimer = React.useCallback((id: string) => {
    const entry = timersRef.current.get(id);
    if (!entry || !entry.pausedAt) return;
    const elapsed = Date.now() - entry.pausedAt;
    entry.remaining = Math.max(1000, entry.remaining - elapsed);
    entry.pausedAt = null;
    const timer = setTimeout(() => {
      dismiss(id);
    }, entry.remaining);
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

  // Cleanup all timers on unmount
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
          "toast-item pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3.5",
          "shadow-lg backdrop-blur-md",
          "border-l-4",
          "text-sm font-medium leading-snug",
          config.className
        )}
        onMouseEnter={() => pauseTimer(toast.id)}
        onMouseLeave={() => resumeTimer(toast.id)}
        onFocus={() => pauseTimer(toast.id)}
        onBlur={() => resumeTimer(toast.id)}
        tabIndex={0}
      >
        <Icon
          size={18}
          className={cn("mt-0.5 shrink-0", config.iconClassName)}
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1">{toast.message}</p>
        <button
          type="button"
          onClick={() => dismiss(toast.id)}
          className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Dismiss notification"
        >
          <X size={14} />
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
          "pointer-events-none fixed z-[200] flex flex-col gap-2.5",
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
