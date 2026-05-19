"use client";

import * as React from "react";
import { FilterDrawer } from "./FilterDrawer";
import { SortMenu } from "./SortMenu";
import type { ProductFilterResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryFacet, CategoryFilterItem } from "./FilterPanel";
import { ViewToggle } from "./ViewToggle";

interface MobileFilterSortBarProps {
  filters: ProductFilterResponse | null;
  facets?: CategoryFacet[];
  categories?: CategoryFilterItem[];
  productCount?: number;
  filterParams?: Record<string, string>;
  currentCategoryPath?: string;
  className?: string;
}

export function MobileFilterSortBar({
  filters,
  facets,
  categories,
  productCount,
  filterParams,
  currentCategoryPath,
  className,
}: MobileFilterSortBarProps) {
  return (
    <div className={cn("w-full lg:hidden", className)}>
      <div className="flex items-center gap-2 p-0">
        <div className="flex-1">
          <FilterDrawer
            filters={filters}
            facets={facets}
            categories={categories}
            productCount={productCount}
            filterParams={filterParams}
            currentCategoryPath={currentCategoryPath}
            className="w-full"
            triggerLabel="Filter"
          />
        </div>
        
        <div className="h-8 w-px bg-border/20" />
        
        <div className="flex-1">
          <SortMenu variant="drawer" className="w-full" />
        </div>

        <div className="h-8 w-px bg-border/20" />

        <div className="flex-none">
           <ViewToggle className="h-10 border-none bg-transparent shadow-none" />
        </div>
      </div>
    </div>
  );
}
