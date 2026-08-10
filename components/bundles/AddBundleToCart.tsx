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
};

export function AddBundleToCart({
  bundleId,
  bundleName,
  availableUnits = 0,
  compact = false,
  className,
}: AddBundleToCartProps) {
  const { addBundle } = useCart();
  const { push } = useToast();
  const { t } = useUiMessages("cart");

  const [quantity, setQuantity] = React.useState(1);
  const soldOut = availableUnits === 0;

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

  const max = Math.max(1, availableUnits);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 items-center rounded-lg border border-input">
          <button
            type="button"
            aria-label={t("decrease_quantity", "Decrease quantity")}
            className="flex h-11 w-10 items-center justify-center text-lg font-semibold disabled:opacity-40"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
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
            disabled={!soldOut && quantity >= max}
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
          >
            +
          </button>
        </div>

        <Button
          variant="primary-gradient"
          size={compact ? "md" : "lg"}
          className="flex-1"
          disabled={soldOut || addBundle.isPending}
          onClick={handleAdd}
        >
          {soldOut
            ? t("sold_out", "Sold out")
            : addBundle.isPending
              ? t("adding", "Adding...")
              : t("add_bundle_to_bag", "Add bundle to bag")}
        </Button>
      </div>
    </div>
  );
}
