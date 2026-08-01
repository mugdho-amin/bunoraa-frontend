"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { formatMoney } from "@/lib/checkout";
import { cn } from "@/lib/utils";
import type { Cart, CartSummary, CheckoutSession } from "@/lib/types";

type CheckoutSummaryProps = {
  cart?: Cart | null;
  cartSummary?: CartSummary | null;
  checkoutSession?: CheckoutSession | null;
  onApplyCoupon: (code: string) => Promise<unknown>;
  onRemoveCoupon: () => Promise<unknown>;
  onUpdateGift: (payload: {
    is_gift?: boolean;
    gift_message?: string;
    gift_wrap?: boolean;
  }) => Promise<unknown>;
  isUpdatingGift?: boolean;
  isApplyingCoupon?: boolean;
  isRemovingCoupon?: boolean;
};

export function CheckoutSummary({
  cart,
  cartSummary,
  checkoutSession,
  onApplyCoupon,
  onRemoveCoupon,
  onUpdateGift,
  isUpdatingGift,
  isApplyingCoupon,
  isRemovingCoupon,
}: CheckoutSummaryProps) {
  const { push } = useToast();
  const currencyCode = cartSummary?.currency_code || cartSummary?.currency || "";
  const appliedCouponCode =
    cartSummary?.coupon_code || cart?.coupon_code || checkoutSession?.coupon_code || "";

  const [couponCode, setCouponCode] = React.useState("");
  const [giftOptions, setGiftOptions] = React.useState({
    is_gift: Boolean(checkoutSession?.is_gift),
    gift_message: checkoutSession?.gift_message || "",
    gift_wrap: Boolean(checkoutSession?.gift_wrap),
  });

  React.useEffect(() => {
    setCouponCode(appliedCouponCode || "");
  }, [appliedCouponCode]);

  React.useEffect(() => {
    setGiftOptions({
      is_gift: Boolean(checkoutSession?.is_gift),
      gift_message: checkoutSession?.gift_message || "",
      gift_wrap: Boolean(checkoutSession?.gift_wrap),
    });
  }, [
    checkoutSession?.is_gift,
    checkoutSession?.gift_message,
    checkoutSession?.gift_wrap,
  ]);

  const handleApplyCoupon = async () => {
    if (appliedCouponCode) {
      push(`Coupon ${appliedCouponCode} is already applied.`, "info");
      return;
    }
    const code = couponCode.trim();
    if (!code) {
      push("Enter a coupon code.", "error");
      return;
    }
    try {
      await onApplyCoupon(code);
      push("Coupon applied.", "success");
    } catch (error) {
      push(
        error instanceof Error ? error.message : "Could not apply coupon.",
        "error"
      );
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await onRemoveCoupon();
      push("Coupon removed.", "info");
    } catch (error) {
      push(
        error instanceof Error ? error.message : "Could not remove coupon.",
        "error"
      );
    }
  };

  const handleGiftUpdate = async () => {
    try {
      await onUpdateGift(giftOptions);
      push("Gift options updated.", "success");
    } catch (error) {
      push(
        error instanceof Error ? error.message : "Could not update gift options.",
        "error"
      );
    }
  };

  const lineValue = (value?: string | null, formatted?: string | null) => {
    if (formatted) return formatted;
    if (value === undefined || value === null) return "--";
    return formatMoney(value, currencyCode);
  };

  const shippingLocation =
    cartSummary?.shipping_estimate_label || cartSummary?.shipping_zone || null;
  const shippingLabel = shippingLocation
    ? `Shipping (${shippingLocation})`
    : "Shipping";

  const summaryContent = (
    <div className="space-y-6">
      <div className="hidden lg:block">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Order summary
        </p>
        <h2 className="text-lg font-semibold">Your items</h2>
      </div>
      <div className="lg:hidden">
        <h2 className="text-base font-semibold">Your items</h2>
      </div>

      <div className="space-y-3">
        {cart?.items?.length ? (
          cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-muted">
                {item.product_image ? (
                  <Image
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    quality={60}
                    sizes="56px"
                    loading="lazy"
                    decoding="async"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.product_name}</p>
                {item.variant_name ? (
                  <p className="truncate text-xs text-muted-foreground">{item.variant_name}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Qty {item.quantity}
                </p>
              </div>
              <div className="text-sm font-semibold">
                {formatMoney(item.total, currencyCode)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Your bag is empty.</p>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{lineValue(cartSummary?.subtotal, cartSummary?.formatted_subtotal)}</span>
        </div>
        {appliedCouponCode ? (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>
              {lineValue(cartSummary?.discount_amount, cartSummary?.formatted_discount)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{shippingLabel}</span>
          <span>{lineValue(cartSummary?.shipping_cost, cartSummary?.formatted_shipping)}</span>
        </div>
        {cartSummary?.pickup_location_name ? (
          <p className="text-xs text-muted-foreground">
            Store pickup — {cartSummary.pickup_location_name}
          </p>
        ) : null}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>{lineValue(cartSummary?.tax_amount, cartSummary?.formatted_tax)}</span>
        </div>
        {(checkoutSession?.gift_wrap ||
          (cartSummary?.gift_wrap_cost &&
            Number(cartSummary.gift_wrap_cost) > 0)) ? (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {cartSummary?.gift_wrap_label || "Gift wrap"}
            </span>
            <span>
              {lineValue(cartSummary?.gift_wrap_cost, cartSummary?.formatted_gift_wrap)}
            </span>
          </div>
        ) : null}
        {(checkoutSession?.payment_method || cartSummary?.payment_fee_label) &&
        (cartSummary?.payment_fee_amount || checkoutSession?.payment_fee_amount) &&
        Number(cartSummary?.payment_fee_amount ?? checkoutSession?.payment_fee_amount ?? 0) >
          0 ? (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {cartSummary?.payment_fee_label ||
                checkoutSession?.payment_fee_label ||
                "Payment fee"}
            </span>
            <span>
              {lineValue(
                cartSummary?.payment_fee_amount ??
                  checkoutSession?.payment_fee_amount ??
                  null,
                cartSummary?.formatted_payment_fee
              )}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>{lineValue(cartSummary?.total, cartSummary?.formatted_total)}</span>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-sm font-semibold">Coupon</p>
        {appliedCouponCode ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-success-500/30 bg-success-500/5 p-3">
            <p className="text-sm text-foreground/80">
              Applied coupon:{" "}
              <span className="font-semibold text-success-600">
                {appliedCouponCode}
              </span>
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full shrink-0 sm:w-auto"
              onClick={handleRemoveCoupon}
              disabled={isRemovingCoupon}
            >
              {isRemovingCoupon ? "Removing..." : "Remove"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon}
            >
              {isApplyingCoupon ? "Applying..." : "Apply"}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div>
          <p className="text-sm font-semibold">Gift options</p>
          <p className="text-xs text-muted-foreground">
            Make it special with a note or gift wrap.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={giftOptions.is_gift}
            onChange={(event) =>
              setGiftOptions((prev) => ({
                ...prev,
                is_gift: event.target.checked,
                gift_wrap: event.target.checked ? prev.gift_wrap : false,
                gift_message: event.target.checked ? prev.gift_message : "",
              }))
            }
          />
          Mark this order as a gift
        </label>
        {giftOptions.is_gift ? (
          <div className="space-y-2">
            <textarea
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              placeholder="Gift message"
              value={giftOptions.gift_message}
              onChange={(event) =>
                setGiftOptions((prev) => ({
                  ...prev,
                  gift_message: event.target.value,
                }))
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={giftOptions.gift_wrap}
                disabled={!cartSummary?.gift_wrap_enabled}
                onChange={(event) =>
                  setGiftOptions((prev) => ({
                    ...prev,
                    gift_wrap: event.target.checked,
                  }))
                }
              />
              {cartSummary?.gift_wrap_label || "Gift wrap"}
              {cartSummary?.gift_wrap_amount ? (
                <span className="text-xs text-muted-foreground">
                  (+{cartSummary.formatted_gift_wrap_amount || formatMoney(
                    cartSummary.gift_wrap_amount,
                    currencyCode
                  )})
                </span>
              ) : null}
            </label>
          </div>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleGiftUpdate}
          disabled={isUpdatingGift}
          className={cn("w-full", isUpdatingGift && "opacity-70")}
        >
          {isUpdatingGift ? "Saving..." : "Update gift options"}
        </Button>
      </div>
    </div>
  );

  const totalLabel = lineValue(cartSummary?.total, cartSummary?.formatted_total);

  return (
    <div className="space-y-4">
      <div className="lg:hidden">
        <details className="group rounded-2xl border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
            <span>Order summary</span>
            <span className="flex items-center gap-2">
              <span>{totalLabel}</span>
              <ChevronDown
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-open:rotate-180"
                strokeWidth={2}
              />
            </span>
          </summary>
          <div className="px-4 pb-4 pt-2">{summaryContent}</div>
        </details>
      </div>

      <Card variant="bordered" className="hidden lg:block">
        {summaryContent}
      </Card>
    </div>
  );
}
