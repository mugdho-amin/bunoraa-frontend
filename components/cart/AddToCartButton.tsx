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
  label?: string;
} & Omit<ButtonProps, "onClick">;

export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
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

  const handleClick = React.useCallback(async () => {
    try {
      const response = await addItem.mutateAsync({ productId, quantity, variantId });
      push(resolveMessage(response, t("added_to_bag", "Added to bag.")), "success");
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
  }, [addItem, productId, quantity, resolveMessage, push, t, variantId]);

  return (
    <Button onClick={handleClick} disabled={addItem.isPending} {...props}>
      {addItem.isPending ? t("adding", "Adding...") : label || t("add_to_bag", "Add to bag")}
    </Button>
  );
}
