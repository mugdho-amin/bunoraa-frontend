import * as React from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "main";
  narrow?: boolean;
  noPad?: boolean;
};

export function PageShell({
  children,
  className,
  as: Tag = "div",
  narrow = false,
  noPad = false,
}: PageShellProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full",
        narrow ? "max-w-3xl" : "max-w-[1920px]",
        !noPad && "px-3 sm:px-5",
        className
      )}
    >
      {children}
    </Tag>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
};

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  as: Tag = "h1",
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border/60 pb-5 pt-6 sm:flex-row sm:items-end sm:justify-between sm:pb-6 sm:pt-8",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="section-eyebrow mb-1.5">{eyebrow}</p> : null}
        <Tag className="text-display font-semibold tracking-tight text-foreground text-balance">
          {title}
        </Tag>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-foreground/60 text-pretty sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}
