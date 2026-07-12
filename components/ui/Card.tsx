import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant =
  | "default"
  | "bordered"
  | "glass"
  | "modern-gradient"
  | "elevated"
  | "flat"
  | "interactive";

const variantClasses: Record<CardVariant, string> = {
  default: "bg-card text-foreground shadow-soft border border-border/50",
  bordered: "bg-card text-foreground border border-border",
  glass:
    "surface-glass text-foreground rounded-2xl",
  "modern-gradient":
    "bg-gradient-to-br from-[hsl(var(--primary)/0.08)] via-[hsl(var(--accent)/0.06)] to-[hsl(var(--primary)/0.14)] text-foreground shadow-soft border border-border/40",
  elevated: "bg-card text-foreground shadow-premium border border-border/40",
  flat: "bg-muted/50 text-foreground border border-transparent",
  interactive:
    "bg-card text-foreground border border-border/50 shadow-soft interactive-lift pressable cursor-pointer",
};

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingClasses = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6 lg:p-8",
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl transition-shadow duration-300",
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-3 flex flex-col gap-1 sm:mb-4", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold tracking-tight text-foreground sm:text-lg",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-foreground/60 leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-foreground/80", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-4 flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-end",
        className
      )}
      {...props}
    />
  );
}
