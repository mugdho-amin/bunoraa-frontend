"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FilterSidebarContext = React.createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function FilterSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <FilterSidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </FilterSidebarContext.Provider>
  );
}

export function FilterSidebarToggle({ className }: { className?: string }) {
  const { open, setOpen } = React.useContext(FilterSidebarContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "hidden lg:inline-flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-medium transition-colors",
        open
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/50 bg-background text-foreground/70 hover:border-primary/40 hover:text-foreground",
        className
      )}
    >
      {open ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
      {open ? "Hide Filters" : "Filters"}
    </button>
  );
}

export function FilterSidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open } = React.useContext(FilterSidebarContext);

  return (
    <aside
      className={cn(
        "hidden lg:block overflow-hidden transition-all duration-300",
        open ? "w-[240px] min-w-[240px] opacity-100" : "w-0 min-w-0 opacity-0",
        className
      )}
    >
      <div className="sticky top-28 w-[240px] space-y-8">
        {children}
      </div>
    </aside>
  );
}
