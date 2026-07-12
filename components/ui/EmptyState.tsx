import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PackageOpen, SearchX, Inbox, type LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
  compact?: boolean;
  children?: React.ReactNode;
};

const defaultIcons = {
  products: PackageOpen,
  search: SearchX,
  default: Inbox,
};

export function EmptyState({
  icon: Icon = defaultIcons.default,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryLabel,
  onSecondary,
  className,
  compact = false,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact
          ? "rounded-2xl border border-dashed border-border/80 bg-card/40 px-4 py-8"
          : "rounded-3xl border border-dashed border-border/80 bg-gradient-to-b from-muted/40 to-card/30 px-5 py-12 sm:px-8 sm:py-16",
        className
      )}
      role="status"
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-2xl bg-primary/8 text-primary",
          compact ? "h-12 w-12" : "h-14 w-14 sm:h-16 sm:w-16"
        )}
      >
        <Icon
          className={compact ? "h-6 w-6" : "h-7 w-7 sm:h-8 sm:w-8"}
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </div>
      <h3
        className={cn(
          "font-semibold tracking-tight text-foreground text-balance",
          compact ? "text-base" : "text-lg sm:text-xl"
        )}
      >
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            "mt-2 max-w-md text-pretty text-foreground/60",
            compact ? "text-sm" : "text-sm sm:text-base"
          )}
        >
          {description}
        </p>
      ) : null}
      {children}
      {(actionLabel || secondaryLabel) && (
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center">
          {actionLabel ? (
            actionHref ? (
              <Button asChild variant="primary" size={compact ? "sm" : "md"} className="w-full sm:w-auto">
                <a href={actionHref}>{actionLabel}</a>
              </Button>
            ) : (
              <Button
                variant="primary"
                size={compact ? "sm" : "md"}
                className="w-full sm:w-auto"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
            )
          ) : null}
          {secondaryLabel ? (
            <Button
              variant="secondary"
              size={compact ? "sm" : "md"}
              className="w-full sm:w-auto"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
