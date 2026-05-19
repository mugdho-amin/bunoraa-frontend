"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { updateParamValue } from "@/lib/productFilters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Check, ListFilter } from "lucide-react";

const orderingOptions = [
  { value: "-created_at", label: "Newest" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "name", label: "Name: A-Z" },
  { value: "-name", label: "Name: Z-A" },
  { value: "-sales_count", label: "Bestsellers" },
  { value: "-average_rating", label: "Top rated" },
];

const minimalOrderingOptions = [
  { value: "", label: "Default Sorting" },
  { value: "-created_at", label: "Latest" },
  { value: "price", label: "Sort by price: low to high" },
  { value: "-price", label: "Sort by price: high to low" },
];

export function SortMenu({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "minimal" | "drawer";
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);

  const options = variant === "minimal" ? minimalOrderingOptions : orderingOptions;
  const fallbackOrdering = variant === "minimal" ? "" : "-created_at";
  const currentOrdering = searchParams.get("ordering") ?? fallbackOrdering;

  const handleSelect = (value: string) => {
    const params = updateParamValue(searchParams, "ordering", value);
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  if (variant === "drawer") {
    const currentLabel = options.find(o => o.value === currentOrdering)?.label || "Sort";

    return (
      <>
        <Button
          variant="secondary"
          className={cn("w-full sm:w-auto", className)}
          onClick={() => setIsOpen(true)}
        >
          <ListFilter className="mr-2 h-4 w-4" />
          {currentLabel}
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
            <div 
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="relative w-full max-w-md animate-in slide-in-from-bottom duration-300 sm:rounded-2xl overflow-hidden">
              <div className="bg-background px-4 py-6 sm:px-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Sort by</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    Close
                  </Button>
                </div>
                <div className="space-y-1">
                  {options.map((option) => {
                    const isSelected = currentOrdering === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors",
                          isSelected 
                            ? "bg-primary/10 font-medium text-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <span className="text-sm">{option.label}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const selectClass =
    variant === "minimal"
      ? "h-9 w-full border border-border bg-transparent px-2 text-xs uppercase tracking-[0.18em] text-foreground sm:w-[13rem]"
      : "h-10 min-h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground sm:w-[12.5rem]";

  return (
    <select
      value={currentOrdering}
      onChange={(event) => {
        handleSelect(event.target.value);
      }}
      className={cn(selectClass, className)}
      aria-label="Sort products"
    >
      {options.map((option) => (
        <option key={option.value || "default"} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
