"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { updateParamValue } from "@/lib/productFilters";
import { cn } from "@/lib/utils";

type ColsOption = 1 | 2 | 4 | 6;

const ICONS: Record<ColsOption, (active: boolean) => React.ReactNode> = {
  1: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="17" height="17" rx="1" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
    </svg>
  ),
  2: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="7.5" height="17" rx="1" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
      <rect x="10" y="0.5" width="7.5" height="17" rx="1" stroke="currentColor" strokeOpacity={active ? 1 : 0.5} />
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

const OPTIONS: { cols: ColsOption; label: string; breakpoint?: "xs" | "sm" | "md" | "lg" }[] = [
  { cols: 1, label: "1", breakpoint: "xs" },
  { cols: 2, label: "2" },
  { cols: 4, label: "4", breakpoint: "sm" },
  { cols: 6, label: "6", breakpoint: "lg" },
];

export function ViewToggle({ className }: { className?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawCols = searchParams.get("cols");
  
  // Determine if we are on mobile to set a better default
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentCols: ColsOption = (rawCols === "1" || rawCols === "2" || rawCols === "4" || rawCols === "6") 
    ? Number(rawCols) as ColsOption 
    : (isMobile ? 2 : 4);

  return (
    <div className={cn("flex items-center gap-0.5 rounded-xl p-0.5", className)}>
      {OPTIONS.map(({ cols, label, breakpoint }) => {
        const active = currentCols === cols;
        return (
          <button
            key={cols}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const params = updateParamValue(searchParams, "cols", String(cols));
              router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-normal transition-all relative z-10",
              active
                ? "text-foreground"
                : "text-foreground/40 hover:text-foreground/80 hover:bg-muted/20",
              breakpoint === "xs" && "flex sm:hidden",
              breakpoint === "sm" && "hidden sm:flex",
              breakpoint === "lg" && "hidden lg:flex"
            )}
            aria-label={`${cols} column grid`}
            aria-pressed={active}
          >
            {ICONS[cols](active)}
            <span className={cn("hidden md:inline-block ml-1", active ? "opacity-100" : "opacity-40")}>{label}</span>
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in duration-300" />
            )}
          </button>
        );
      })}
    </div>
  );
}
