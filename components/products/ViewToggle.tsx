"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { updateParamValue } from "@/lib/productFilters";
import { cn } from "@/lib/utils";

type ColsOption = 2 | 4 | 6;

const ICONS: Record<ColsOption, (active: boolean) => React.ReactNode> = {
  2: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="7" height="17" rx="1" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="10.5" y="0.5" width="7" height="17" rx="1" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
    </svg>
  ),
  4: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="3.5" height="17" rx="1" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="5" y="0.5" width="3.5" height="17" rx="1" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="9.5" y="0.5" width="3.5" height="17" rx="1" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="14" y="0.5" width="3.5" height="17" rx="1" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
    </svg>
  ),
  6: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="2" height="17" rx="0.8" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="3.5" y="0.5" width="2" height="17" rx="0.8" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="6.5" y="0.5" width="2" height="17" rx="0.8" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="9.5" y="0.5" width="2" height="17" rx="0.8" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="12.5" y="0.5" width="2" height="17" rx="0.8" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="15.5" y="0.5" width="2" height="17" rx="0.8" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
    </svg>
  ),
};

const OPTIONS: { cols: ColsOption; label: string }[] = [
  { cols: 2, label: "2" },
  { cols: 4, label: "4" },
  { cols: 6, label: "6" },
];

export function ViewToggle({ className }: { className?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawCols = searchParams.get("cols");
  const currentCols: ColsOption = rawCols === "2" || rawCols === "6" ? Number(rawCols) as ColsOption : 4;

  return (
    <div className={cn("flex items-center gap-0.5 rounded-xl border border-border bg-card p-0.5", className)}>
      {OPTIONS.map(({ cols, label }) => {
        const active = currentCols === cols;
        return (
          <button
            key={cols}
            type="button"
            onClick={() => {
              const params = updateParamValue(searchParams, "cols", String(cols));
              router.push(`${pathname}?${params.toString()}`);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground/80"
            )}
            aria-label={`${cols} column grid`}
            aria-pressed={active}
          >
            {ICONS[cols](active)}
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
