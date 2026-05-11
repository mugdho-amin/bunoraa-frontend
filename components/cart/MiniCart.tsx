"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/useCart";
import { useUiMessages } from "@/components/i18n/useUiMessages";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

function formatMoney(amount: string | number, config: { symbol: string, position: string }) {
  const numeric = typeof amount === "string" ? parseMoney(amount) ?? 0 : amount;
  const formatted = numeric.toFixed(2);
  return config.position === 'before' 
    ? `${config.symbol}${formatted}` 
    : `${formatted} ${config.symbol}`;
}

function parseMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/[\u00A0\u202F\s]/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/[^\d,.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function MiniCart({
  title,
  onClose,
  className,
}: {
  title?: string;
  onClose?: () => void;
  className?: string;
}) {
  const { cartQuery, cartSummaryQuery, removeItem, updateItem } = useCart();
  const { t } = useUiMessages("cart");
  const handleClose = () => onClose?.();
  const [currencyConfig, setCurrencyConfig] = React.useState({ symbol: 'BDT', position: 'after' });

  React.useEffect(() => {
    apiFetch<{symbol: string, position: string}>("/commerce/cart/currency-config/")
      .then((res) => {
          if (res.data) setCurrencyConfig(res.data);
      })
      .catch(() => {});
  }, []);

  if (cartQuery.isLoading) {
    return <div className="p-6 text-sm text-foreground/60">Loading your bag...</div>;
  }

  if (cartQuery.isError || !cartQuery.data) {
    return <div className="p-6 text-sm text-red-500">Error loading cart. Please try again.</div>;
  }

  const cart = cartQuery.data;
  const currency = cart.currency || "";

  // Derive subtotal locally from cart items for instant updates
  const subtotalValue = cart.items.reduce((sum, item) => {
    const unit = parseMoney(item.unit_price) ?? 0;
    const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
    return sum + (unit * qty);
  }, 0);
  
  const subtotalLabel = formatMoney(subtotalValue, currencyConfig);

  // Use summary only for adjustments (discount, tax, etc.)
  const summary = cartSummaryQuery.data;
  const discount = parseMoney(summary?.discount_amount ?? cart.discount_amount) ?? 0;
  const shipping = parseMoney(summary?.shipping_cost) ?? 0;
  const tax = parseMoney(summary?.tax_amount) ?? 0;
  const giftWrap = parseMoney(summary?.gift_wrap_amount ?? summary?.gift_wrap_cost) ?? 0;
  const paymentFee = parseMoney(summary?.payment_fee_amount) ?? 0;

  const totalValue = Math.max(0, subtotalValue - discount + shipping + tax + giftWrap + paymentFee);
  const totalLabel = formatMoney(totalValue, currencyConfig);

  if (cart.items.length === 0) {
    return (
      <div className={cn("flex items-center justify-between p-3", className)}>
        <p className="text-sm font-medium text-foreground">
          {t("empty_bag_text", "You have no item in your bag.")}
        </p>
        {onClose ? (
          <button
            type="button"
            className="text-foreground/60 hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-base font-medium">{title || t("mini_bag_title", "Your bag")}</h3>
        {onClose ? (
          <button
            type="button"
            className="text-foreground/60 hover:text-foreground"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative h-20 w-16 bg-muted rounded-sm shrink-0 overflow-hidden">
              {item.product_image ? (
                <Image
                  src={item.product_image}
                  alt={item.product_name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : null}
            </div>
            <div className="flex-1 space-y-0.5 min-w-0">
              <p className="text-sm font-medium truncate">{item.product_name}</p>
              <p className="text-[10px] text-foreground/60 truncate">{item.variant_name}</p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center border border-border rounded-sm">
                  <button className="px-2 py-0.5 text-xs font-bold" onClick={() => updateItem.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })}>-</button>
                  <span className="px-2 text-xs font-medium">{item.quantity}</span>
                  <button className="px-2 py-0.5 text-xs font-bold" onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}>+</button>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <p className="text-sm font-medium">{formatMoney(item.total, currencyConfig)}</p>
                  <button 
                    className="text-[10px] text-foreground/40 hover:text-red-500" 
                    onClick={() => removeItem.mutate(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-foreground/70">{t("subtotal", "Subtotal")}</span>
          <span className="font-semibold">{subtotalLabel}</span>
        </div>
        {(discount > 0 || shipping > 0 || tax > 0) && (
          <div className="flex justify-between text-base font-semibold">
            <span className="text-foreground">{t("estimated_total", "Estimated Total")}</span>
            <span className="font-bold text-primary">{totalLabel}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button asChild variant="secondary" className="h-9 w-full uppercase tracking-widest text-[10px]">
            <Link href="/cart/" onClick={handleClose}>
              {t("view_bag", "View Bag")}
            </Link>
          </Button>
          <Button asChild variant="primary" className="h-9 w-full uppercase tracking-widest text-[10px]">
            <Link href="/checkout/" onClick={handleClose}>
              {t("checkout", "Checkout")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
