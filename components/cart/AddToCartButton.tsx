"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/Button";
import { useCart } from "@/components/cart/useCart";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { useUiMessages } from "@/components/i18n/useUiMessages";

type AddToCartButtonProps = {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  customizationData?: Record<string, string> | null;
  label?: string;
} & Omit<ButtonProps, "onClick">;

export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  customizationData,
  label,
  ...props
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { push } = useToast();
  const { t } = useUiMessages("cart");

  const resolveMessage = React.useCallback((response: unknown, fallback: string) => {
    if (response && typeof response === "object" && "message" in response) {
      const message = String((response as { message?: string }).message || "").trim();
      if (message && message.toLowerCase() !== "ok") return message;
    }
    return fallback;
  }, []);

  const hasCustomization = customizationData && Object.keys(customizationData).length > 0;

  const handleClick = React.useCallback(async () => {
    try {
      const response = await addItem.mutateAsync({ productId, quantity, variantId, customizationData: hasCustomization ? customizationData : undefined });
      push(resolveMessage(response, t("added_to_bag", "Added to bag.")), "success");
      // A product detail page should confirm success in context.  The header
      // owns the drawer, so use a small browser event rather than coupling
      // every product card to layout state.
      window.dispatchEvent(new CustomEvent("bunoraa:cart-added"));
    } catch (error) {
      if (error instanceof ApiError) {
        if (typeof error.data === "object" && error.data && "message" in error.data) {
          const message = String((error.data as { message?: string }).message || "").trim();
          push(message || t("add_failed", "Could not add to bag."), "error");
          return;
        }
        push(error.message || t("add_failed", "Could not add to bag."), "error");
        return;
      }
      push(t("add_failed", "Could not add to bag."), "error");
    }
  }, [addItem, productId, quantity, resolveMessage, push, t, variantId, customizationData, hasCustomization]);

  return (
    <Button onClick={handleClick} disabled={addItem.isPending} {...props}>
      {addItem.isPending ? t("adding", "Adding...") : label || t("add_to_bag", "Add to bag")}
    </Button>
  );
}
