"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { updateParamValue } from "@/lib/productFilters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Check, ListFilter, X, ChevronDown } from "lucide-react";

const options = [
  { value: "-created_at", label: "Newest" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "name", label: "Name: A-Z" },
  { value: "-name", label: "Name: Z-A" },
];

export function SortMenu({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "drawer" | "minimal";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentOrdering = searchParams.get("ordering") || "";
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const params = updateParamValue(searchParams, "ordering", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  React.useEffect(() => {
    if (!isOpen || variant !== "drawer") return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [isOpen, variant]);

  if (variant === "drawer") {
    return (
      <>
        <Button
          variant="ghost"
          className={cn(
            "w-full sm:w-auto h-8 px-2 rounded-lg border border-border/60 text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 transition-colors hover:bg-muted/50 font-normal",
            className
          )}
          onClick={() => setIsOpen(true)}
        >
          <ListFilter className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">Sort</span>
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="relative w-full h-full max-w-md animate-in slide-in-from-bottom duration-500 ease-out sm:rounded-none overflow-hidden bg-background">
              <div className="flex flex-col h-full">
                <div className="sticky top-0 z-10 flex-none bg-background px-6 py-4 sm:px-8 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black tracking-tight">Sort by</h3>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 scrolling-touch">
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
                              ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.01]" 
                              : "bg-muted/30 hover:bg-muted text-foreground/70"
                          )}
                        >
                          <span className="text-sm font-bold uppercase tracking-widest truncate mr-2">{option.label}</span>
                          {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sticky bottom-0 flex-none bg-background p-4 sm:p-8 border-t border-border/50">
                   <Button variant="secondary" className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => setIsOpen(false)}>
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

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <span className="text-xs font-bold uppercase tracking-widest text-foreground/40 hidden xl:inline">Sort:</span>
      <select
        value={currentOrdering}
        onChange={(event) => {
          handleSelect(event.target.value);
        }}
        className={cn(
          "h-10 w-full rounded-xl bg-muted/20 px-3 pr-8 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer appearance-none",
          className
        )}
        aria-label="Sort products"
      >
        {options.map((option) => (
          <option key={option.value || "default"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 h-3.5 w-3.5 text-foreground/50 pointer-events-none" />
    </div>
  );
}
