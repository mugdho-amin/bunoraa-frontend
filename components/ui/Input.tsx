import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  inputSize?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-10 min-h-10 px-3 text-sm rounded-xl",
  md: "h-11 min-h-11 px-3.5 text-base rounded-xl sm:text-sm",
  lg: "h-12 min-h-12 px-4 text-base rounded-2xl",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, inputSize = "md", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex w-full border bg-card text-foreground shadow-xs transition-colors",
          "placeholder:text-foreground/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-error-500 focus-visible:ring-error-500/40"
            : "border-border hover:border-foreground/25",
          sizeClasses[inputSize],
          className
        )}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border bg-card px-3.5 py-3 text-base text-foreground shadow-xs transition-colors sm:text-sm",
          "placeholder:text-foreground/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-error-500 focus-visible:ring-error-500/40"
            : "border-border hover:border-foreground/25",
          className
        )}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-foreground/80",
        className
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-0.5 text-error-500" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}
