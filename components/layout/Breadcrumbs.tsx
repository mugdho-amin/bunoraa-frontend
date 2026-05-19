"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-[11px] font-normal tracking-wide text-foreground/40", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={item.url}>
            {index > 0 && (
              <span className="text-[10px] opacity-60 px-0.5">&gt;</span>
            )}
            {isLast ? (
              <span className="truncate max-w-[150px] sm:max-w-none text-foreground/50">
                {item.name}
              </span>
            ) : (
              <Link
                href={item.url}
                className="hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
