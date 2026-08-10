"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/useCart";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { useUiMessages } from "@/components/i18n/useUiMessages";

type AddBundleToCartProps = {
  bundleId: string;
  bundleName: string;
  availableUnits?: number;
  compact?: boolean;
  className?: string;
  quantity?: number;
  onQuantityChange?: (quantity: number) => void;
};

export function AddBundleToCart({
  bundleId,
  bundleName,
  availableUnits,
  compact = false,
  className,
  quantity: controlledQuantity,
  onQuantityChange,
}: AddBundleToCartProps) {
  const { addBundle } = useCart();
  const { push } = useToast();
  const { t } = useUiMessages("cart");

  const [internalQuantity, setInternalQuantity] = React.useState(1);
  const isControlled = typeof controlledQuantity === "number";
  const quantity = isControlled ? controlledQuantity : internalQuantity;
  const soldOut = typeof availableUnits === "number" && availableUnits <= 0;
  const max = soldOut
    ? 1
    : Math.max(1, typeof availableUnits === "number" ? availableUnits : 99);

  const setQuantity = React.useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(1, next), max);
      if (isControlled) onQuantityChange?.(clamped);
      else setInternalQuantity(clamped);
    },
    [isControlled, max, onQuantityChange]
  );

  const handleAdd = React.useCallback(async () => {
    try {
      const response = await addBundle.mutateAsync({ bundleId, quantity });
      const message =
        response && typeof response === "object" && "message" in response
          ? String((response as { message?: string }).message || "").trim()
          : "";
      push(
        message && message.toLowerCase() !== "ok"
          ? message
          : t("bundle_added", `${bundleName} added to bag.`),
        "success"
      );
      window.dispatchEvent(new CustomEvent("bunoraa:cart-added"));
    } catch (error) {
      if (error instanceof ApiError) {
        if (typeof error.data === "object" && error.data && "message" in error.data) {
          push(String((error.data as { message?: string }).message || ""), "error");
          return;
        }
        push(error.message || t("add_failed", "Could not add to bag."), "error");
        return;
      }
      push(t("add_failed", "Could not add to bag."), "error");
    }
  }, [addBundle, bundleId, quantity, push, t, bundleName]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 items-center rounded-lg border border-input">
          <button
            type="button"
            aria-label={t("decrease_quantity", "Decrease quantity")}
            className="flex h-11 w-10 items-center justify-center text-lg font-semibold disabled:opacity-40"
            disabled={quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-sm font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={t("increase_quantity", "Increase quantity")}
            className="flex h-11 w-10 items-center justify-center text-lg font-semibold disabled:opacity-40"
            disabled={soldOut || quantity >= max}
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>

        <Button
          variant="primary-gradient"
          size={compact ? "md" : "lg"}
          className="min-w-0 flex-1 whitespace-nowrap text-sm sm:text-base"
          disabled={soldOut || addBundle.isPending}
          onClick={handleAdd}
        >
          <span className="truncate">
            {soldOut
              ? t("sold_out", "Sold out")
              : addBundle.isPending
                ? t("adding", "Adding...")
                : compact
                  ? t("add_to_bag", "Add to bag")
                  : t("add_bundle_to_bag", "Add bundle to bag")}
          </span>
        </Button>
      </div>
    </div>
  );
}