import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "outline"
  | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-foreground/90 text-background",
  primary: "bg-primary/12 text-primary",
  accent: "bg-accent/15 text-accent-800 dark:text-accent-300",
  success: "bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-200",
  warning: "bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-200",
  error: "bg-error-100 text-error-800 dark:bg-error-900/40 dark:text-error-200",
  outline: "border border-border bg-transparent text-foreground/80",
  muted: "bg-muted text-foreground/70",
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: "sm" | "md";
};

export function Badge({
  className,
  variant = "default",
  size = "sm",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold uppercase tracking-wider",
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-[11px]",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
