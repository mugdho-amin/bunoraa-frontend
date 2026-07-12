"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCompareItems, removeCompareItem, clearCompareItems } from "@/lib/compare";
import { formatMoney } from "@/lib/money";

export function CompareTray() {
  const [items, setItems] = React.useState(getCompareItems());

  React.useEffect(() => {
    const handler = () => setItems(getCompareItems());
    handler();
    window.addEventListener("compare-updated", handler);
    return () => window.removeEventListener("compare-updated", handler);
  }, []);

  if (!items.length) return null;

  return (
    <div
      className="fixed inset-x-3 z-50 mx-auto max-w-4xl rounded-2xl border border-border/80 bg-card/95 p-3 shadow-premium backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-[95%] sm:-translate-x-1/2 sm:p-4"
      style={{
        bottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
      role="region"
      aria-label="Compare products"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex max-w-full gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap sm:items-center sm:gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs shadow-xs"
            >
              <span className="max-w-[140px] truncate font-medium sm:max-w-[160px]">{item.name}</span>
              <button
                type="button"
                className="flex h-7 w-7 min-h-7 min-w-7 items-center justify-center rounded-full text-foreground/60 transition hover:bg-muted hover:text-foreground"
                onClick={() => {
                  removeCompareItem(item.id);
                  setItems(getCompareItems());
                }}
                aria-label={`Remove ${item.name} from compare`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => clearCompareItems()}>
            Clear
          </Button>
          <Button asChild size="sm" variant="primary-gradient" className="flex-1 sm:flex-none">
            <Link href="/compare/">Compare ({items.length})</Link>
          </Button>
          <div className="hidden text-xs text-foreground/55 sm:block">
            {items[0]?.current_price
              ? `Starting at ${formatMoney(items[0]?.current_price, items[0]?.currency || "USD")}`
              : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
