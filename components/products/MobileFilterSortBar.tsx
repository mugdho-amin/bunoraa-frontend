"use client";

import * as React from "react";
import { FilterDrawer } from "./FilterDrawer";
import { SortMenu } from "./SortMenu";
import type { ProductFilterResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MobileFilterSortBarProps {
  filters: ProductFilterResponse | null;
  productCount?: number;
  filterParams?: Record<string, string>;
  className?: string;
}

export function MobileFilterSortBar({
  filters,
  productCount,
  filterParams,
  className,
}: MobileFilterSortBarProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  // Optional: Hide/Show on scroll for better visibility
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 z-40 w-full border-t border-border bg-background/95 p-3 backdrop-blur transition-transform duration-300 lg:hidden",
        !isVisible && "translate-y-full",
        className
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="flex-1">
          <FilterDrawer
            filters={filters}
            productCount={productCount}
            filterParams={filterParams}
            className="w-full"
            triggerLabel="Filter"
          />
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex-1">
          <SortMenu variant="drawer" className="w-full" />
        </div>
      </div>
    </div>
  );
}
