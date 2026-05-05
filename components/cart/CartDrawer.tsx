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
          "absolute inset-0 bg-foreground/10 transition-opacity duration-300 ease-in-out",
          itemCount > 0 && "backdrop-blur-sm",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Dynamic Drawer Content */}
      {itemCount === 0 ? (
        <div 
          className={cn(
            "absolute top-4 right-4 flex w-80 flex-col bg-background p-4 shadow-xl rounded-lg border border-border transition-all duration-300",
            isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          )}
        >
          <MiniCart onClose={onClose} className="h-auto p-0" />
        </div>
      ) : (
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <MiniCart onClose={onClose} className="h-full border-none shadow-none bg-transparent p-0" />
        </aside>
      )}
    </div>,
    document.body
  );
}
