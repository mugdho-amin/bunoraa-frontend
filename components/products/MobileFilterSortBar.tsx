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

import { ViewToggle } from "./ViewToggle";

export function MobileFilterSortBar({
  filters,
  productCount,
  filterParams,
  className,
}: MobileFilterSortBarProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
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
        "fixed bottom-6 left-1/2 z-40 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-md lg:hidden transition-all duration-500",
        !isVisible ? "translate-y-24 opacity-0" : "translate-y-0 opacity-100",
        className
      )}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/80 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5">
        <div className="flex-1">
          <FilterDrawer
            filters={filters}
            productCount={productCount}
            filterParams={filterParams}
            className="w-full"
            triggerLabel="Filter"
          />
        </div>
        
        <div className="h-8 w-px bg-border/40" />
        
        <div className="flex-1">
          <SortMenu variant="drawer" className="w-full" />
        </div>

        <div className="h-8 w-px bg-border/40" />

        <div className="flex-none">
           <ViewToggle className="h-10 border-none bg-transparent shadow-none" />
        </div>
      </div>
    </div>
  );
}
