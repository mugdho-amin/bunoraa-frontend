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
  currentCategoryPath?: string;
  className?: string;
}

export function MobileFilterSortBar({
  filters,
  facets,
  categories,
  productCount,
  currentCategoryPath,
  className,
}: MobileFilterSortBarProps) {
  return (
    <div className={cn("w-full lg:hidden", className)}>
      <div className="flex items-center justify-between gap-1.5 p-0">
        <div className="flex-1 flex justify-start">
          <FilterDrawer
            filters={filters}
            facets={facets}
            categories={categories}
            productCount={productCount}
            currentCategoryPath={currentCategoryPath}
            className="w-full sm:w-auto"
          />
        </div>
        
        <div className="flex-none flex justify-center">
           <ViewToggle className="border-none bg-transparent shadow-none" />
        </div>

        <div className="flex-1 flex justify-end">
          <SortMenu variant="drawer" className="w-full sm:w-auto" />
        </div>
      </div>
    </div>
  );
}
