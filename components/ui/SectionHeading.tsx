import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
  id?: string;
  children?: React.ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  align = "left",
  className,
  as: Tag = "h2",
  id,
  children,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-row items-end justify-between gap-3 sm:mb-6",
        align === "center" && "flex-col items-center text-center",
        className
      )}
    >
      <div className={cn("min-w-0 flex-1", align === "center" && "mx-auto max-w-2xl")}>
        {eyebrow ? <p className="section-eyebrow mb-1.5">{eyebrow}</p> : null}
        <Tag id={id} className="section-title text-balance">{title}</Tag>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-foreground/60 text-pretty sm:text-base">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {href ? (
        <Link
          href={href}
          prefetch={false}
          className={cn(
            "group inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-border/80 bg-card px-3.5 py-2 text-sm font-medium text-foreground/80 shadow-xs transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
            align === "center" && "self-center"
          )}
        >
          {linkLabel}
          <ChevronRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      ) : null}
    </div>
  );
}
