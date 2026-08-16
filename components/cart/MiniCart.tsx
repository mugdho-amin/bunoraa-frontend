"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/components/cart/useCart";
import { useUiMessages } from "@/components/i18n/useUiMessages";
import { useSiteSettings, useMediaUrl } from "@/components/providers/SiteSettingsProvider";
import { cn } from "@/lib/utils";
import { formatMoney, parseMoney } from "@/lib/money";

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
  const siteSettings = useSiteSettings();
  const mediaUrl = useMediaUrl();
  const fullImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
    return `${mediaUrl}${url}`;
  };
  const handleClose = () => onClose?.();
  const defaultSymbol = siteSettings?.currency_symbol || "৳";
  const [currencyConfig, setCurrencyConfig] = React.useState({ symbol: defaultSymbol, position: 'after' as const });

  React.useEffect(() => {
    setCurrencyConfig(prev => ({ ...prev, symbol: siteSettings?.currency_symbol || prev.symbol }));
  }, [siteSettings?.currency_symbol]);

  if (cartQuery.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading your bag...</div>;
  }

  if (cartQuery.isError || !cartQuery.data) {
    return <div className="p-6 text-sm text-red-500">Error loading cart. Please try again.</div>;
  }

  const cart = cartQuery.data;

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
  const freeShippingThreshold = Number(siteSettings?.free_shipping_threshold || 0);
  const amountUntilFreeShipping = Math.max(0, freeShippingThreshold - subtotalValue);
  const freeShippingProgress = freeShippingThreshold > 0
    ? Math.min(100, Math.round((subtotalValue / freeShippingThreshold) * 100))
    : 0;
  const isMutating = updateItem.isPending || removeItem.isPending;
  const mutationError = updateItem.error || removeItem.error;

  if (cart.items.length === 0) {
    return (
      <div className={cn("flex h-full flex-col justify-between p-5", className)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">{title || t("mini_bag_title", "Your bag")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("empty_bag_text", "You have no item in your bag.")}</p>
          </div>
          {onClose ? (
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={onClose}
              aria-label="Close shopping bag"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-base font-semibold">{title || t("mini_bag_title", "Your bag")}</h3>
        {onClose ? (
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            onClick={onClose}
            aria-label="Close shopping bag"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

<div className="flex-1 space-y-4 overflow-y-auto p-4" aria-busy={isMutating}>
        {cart.items.map((item) => {
          const isBundle = item.cart_item_type === "bundle";
          const itemLink = isBundle && item.bundle_slug
            ? `/bundles/${item.bundle_slug}/`
            : item.product_slug
              ? `/products/${item.product_slug}/`
              : null;
          const itemName = item.product_name || item.bundle_name || "Item";
          const bundleCount = item.bundle_items?.length ?? 0;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted">
                {fullImageUrl(item.product_image) ? (
                  <Image
                    src={fullImageUrl(item.product_image)!}
                    alt={itemName}
                    fill
                    quality={60}
                    className="object-cover"
                    sizes="72px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  {itemLink ? (
                    <Link href={itemLink} className="truncate text-sm font-semibold hover:text-primary">
                      {itemName}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-semibold">{itemName}</p>
                  )}
                  {isBundle ? (
                    <Badge variant="accent" size="sm">Bundle</Badge>
                  ) : null}
                </div>
                {isBundle && bundleCount > 0 ? (
                  <p className="truncate text-xs text-muted-foreground" title={item.bundle_items?.map((b) => `${b.quantity}× ${b.product_name}`).join(", ")}>
                    {bundleCount} items · {item.bundle_items?.map((b) => `${b.quantity}× ${b.product_name}`).slice(0, 2).join(", ")}
                    {bundleCount > 2 ? "…" : ""}
                  </p>
                ) : item.variant_name ? (
                  <p className="truncate text-xs text-muted-foreground">{item.variant_name}</p>
                ) : null}
                <div className="flex items-end justify-between gap-2 pt-2">
                  <div className="inline-flex items-center rounded-lg border border-border bg-background" aria-label={`Quantity for ${itemName}`}>
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" onClick={() => updateItem.mutate({ itemId: item.id, quantity: Math.max(1, item.quantity - 1) })} disabled={isMutating || item.quantity <= 1} aria-label={`Decrease quantity of ${itemName}`}><Minus className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    <span className="flex h-8 min-w-8 items-center justify-center border-x border-border px-2 text-xs font-semibold tabular-nums" aria-live="polite">{item.quantity}</span>
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })} disabled={isMutating} aria-label={`Increase quantity of ${itemName}`}><Plus className="h-3.5 w-3.5" aria-hidden="true" /></button>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <p className="text-sm font-semibold">{formatMoney(item.total, currencyConfig)}</p>
                    <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40" onClick={() => removeItem.mutate(item.id)} disabled={isMutating}><Trash2 className="h-3 w-3" aria-hidden="true" /> Remove</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-border bg-card/60 p-4">
        {freeShippingThreshold > 0 ? (
          <div className="rounded-xl border border-border/70 bg-background/70 p-3">
            <div className="flex items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-xs leading-5 text-muted-foreground">
                {amountUntilFreeShipping > 0 ? `Add ${formatMoney(amountUntilFreeShipping, currencyConfig)} more for free delivery.` : "You qualify for free delivery."}
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Progress toward free delivery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={freeShippingProgress}>
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${freeShippingProgress}%` }} />
            </div>
          </div>
        ) : null}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal", "Subtotal")}</span>
          <span className="font-semibold">{subtotalLabel}</span>
        </div>
        {(discount > 0 || shipping > 0 || tax > 0) && (
          <div className="flex justify-between text-base font-semibold">
            <span className="text-foreground">{t("estimated_total", "Estimated Total")}</span>
            <span className="font-bold text-primary">{totalLabel}</span>
          </div>
        )}
        {mutationError ? <p className="text-xs text-destructive" role="alert">Could not update your bag. Please try again.</p> : null}
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
