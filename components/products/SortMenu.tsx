"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { updateParamValue } from "@/lib/productFilters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Check, ListFilter, X } from "lucide-react";

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
          className={cn("w-full sm:w-auto h-10 sm:h-11 rounded-xl font-bold uppercase tracking-widest text-[10px]", className)}
          onClick={() => setIsOpen(true)}
        >
          <ListFilter className="mr-2 h-3.5 w-3.5" />
          {currentLabel}
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="relative w-full max-w-md animate-in slide-in-from-bottom duration-500 ease-out sm:rounded-t-[2.5rem] overflow-hidden">
              <div className="bg-background px-6 py-8 sm:px-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight">Sort by</h3>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {options.map((option) => {
                    const isSelected = currentOrdering === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-all duration-300",
                          isSelected 
                            ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                            : "bg-muted/30 hover:bg-muted text-foreground/70"
                        )}
                      >
                        <span className="text-sm font-bold uppercase tracking-widest">{option.label}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-8">
                   <Button variant="secondary" className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={() => setIsOpen(false)}>
                      Cancel
                   </Button>
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

