"use client";

import * as React from "react";
import type { ProductFilterResponse } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  FilterPanel,
  CategoryFacet,
  CategoryFilterItem,
} from "@/components/products/FilterPanel";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clearAllFilters } from "@/lib/productFilters";

export function FilterDrawer({
  filters,
  facets,
  categories,
  productCount,
  className,
  currentCategoryPath,
  variant = "default",
}: {
  filters: ProductFilterResponse | null;
  facets?: CategoryFacet[];
  categories?: CategoryFilterItem[];
  productCount?: number;
  className?: string;
  currentCategoryPath?: string;
  variant?: "default" | "minimal";
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const shouldHideFilters = typeof productCount === "number" && productCount <= 1 && !searchParams.toString();
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const handleClearAll = () => {
    const params = clearAllFilters(searchParams);
    router.push(`${pathname}?${params.toString()}`);
  };

  React.useEffect(() => {
    if (!open || shouldHideFilters) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shouldHideFilters]);

  React.useEffect(() => {
    if (!open || shouldHideFilters) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [open, shouldHideFilters]);

  React.useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  if (shouldHideFilters) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        className="w-full sm:w-auto h-8 px-2 rounded-lg border border-border/60 text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 transition-colors hover:bg-muted/50 font-normal"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-filter-drawer"
      >
        <SlidersHorizontal className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">Filters</span>
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[100]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
        >
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setOpen(false)} 
          />
          <div
            id="mobile-filter-drawer"
            className="absolute inset-0 h-full overflow-hidden rounded-none border-t border-border bg-background shadow-2xl animate-in slide-in-from-bottom duration-500 ease-out sm:inset-y-0 sm:left-0 sm:right-auto sm:h-full sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none sm:border-r"
          >
            <div className="flex h-full flex-col">
              <div className="sticky top-0 z-10 flex-none border-b border-border/50 bg-background/95 px-6 py-3 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 id="mobile-filter-title" className="text-lg font-black tracking-tight">
                      Filters
                    </h2>
                    {typeof productCount === "number" ? (
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        {productCount} results
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                      onClick={handleClearAll}
                    >
                      Reset
                    </Button>
                    <button
                      ref={closeButtonRef}
                      onClick={() => setOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 scrolling-touch">
                <FilterPanel
                  filters={filters}
                  facets={facets}
                  categories={categories}
                  productCount={productCount}
                  currentCategoryPath={currentCategoryPath}
                  variant={variant}
                />
              </div>

              <div className="sticky bottom-0 flex-none border-t border-border/50 bg-background/95 p-4 backdrop-blur-xl sm:hidden">
                <Button 
                  variant="primary" 
                  className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20" 
                  onClick={() => setOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
