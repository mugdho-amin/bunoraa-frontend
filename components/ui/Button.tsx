import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "primary-gradient"
  | "outline"
  | "destructive"
  | "soft";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-soft hover:bg-primary-700 hover:shadow-soft-lg active:scale-[0.98]",
  secondary:
    "border border-border bg-card text-foreground shadow-xs hover:bg-muted hover:border-border active:scale-[0.98]",
  ghost: "bg-transparent text-foreground hover:bg-muted active:scale-[0.98]",
  "primary-gradient":
    "bg-gradient-to-r from-primary via-primary-600 to-accent text-white shadow-glow hover:opacity-95 active:scale-[0.98]",
  outline:
    "border border-primary/40 text-primary hover:bg-primary/5 hover:border-primary active:scale-[0.98]",
  destructive:
    "bg-error-600 text-white shadow-soft hover:bg-error-700 active:scale-[0.98]",
  soft:
    "bg-primary/10 text-primary hover:bg-primary/15 active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 min-h-10 px-4 text-sm rounded-xl",
  md: "h-11 min-h-11 px-6 text-sm rounded-xl",
  lg: "h-12 min-h-12 px-8 text-base rounded-2xl",
  icon: "h-11 w-11 min-h-11 min-w-11 p-0 rounded-full",
  "icon-sm": "h-9 w-9 min-h-9 min-w-9 p-0 rounded-full",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out-expo",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
      variantClasses[variant],
      sizeClasses[size],
      loading && "relative text-transparent",
      className
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
          </span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
