"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { MiniCart } from "@/components/cart/MiniCart";

export function CartDrawer({
  isOpen,
  onClose,
  itemCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
}) {
  const originalOverflow = React.useRef<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    originalOverflow.current = original;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("cart-drawer-open");
    return () => {
      document.body.style.overflow = originalOverflow.current || "";
      originalOverflow.current = null;
      document.documentElement.classList.remove("cart-drawer-open");
    };
  }, [isOpen]);

  if (!isOpen || !mounted) {
    return null;
  }

  return createPortal(
    <div
      data-cart-drawer-root
      className="fixed inset-0 z-[100]"
      aria-hidden={!isOpen}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* Dimmed Background Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-foreground/25 transition-opacity duration-300 ease-out-expo",
          itemCount > 0 && "backdrop-blur-sm",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Dynamic Drawer Content */}
      {itemCount === 0 ? (
        <div 
          className={cn(
            "absolute right-3 top-[calc(var(--header-offset,4.75rem)+0.5rem)] flex w-[min(100vw-1.5rem,20rem)] flex-col rounded-2xl border border-border/80 bg-card p-4 shadow-premium transition-all duration-300 ease-out-expo sm:right-4 sm:w-80",
            isOpen ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping bag"
        >
          <MiniCart onClose={onClose} className="h-auto p-0" />
        </div>
      ) : (
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border/60 bg-background/95 shadow-premium backdrop-blur-xl transition-transform duration-300 ease-out-expo supports-[height:100dvh]:h-[100dvh]",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping bag"
          onClick={(event) => event.stopPropagation()}
        >
          <MiniCart onClose={onClose} className="h-full border-none bg-transparent p-0 shadow-none" />
        </aside>
      )}
    </div>,
    document.body
  );
}
