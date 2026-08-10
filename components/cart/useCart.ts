import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Cart, CartSummary } from "@/lib/types";
import { parseMoney } from "@/lib/money";

type AddItemInput = {
  productId: string;
  quantity?: number;
  variantId?: string | null;
  customizationData?: Record<string, string>;
};

type UpdateItemInput = {
  itemId: string;
  quantity: number;
};

type ApplyCouponInput = {
  code: string;
};

type ShareCartInput = {
  name?: string;
  permission?: string;
  expires_days?: number;
  password?: string;
};

type GiftOptionsInput = {
  is_gift?: boolean;
  gift_message?: string;
  gift_wrap?: boolean;
};

const cartKey = ["cart"] as const;
const cartSummaryKey = ["cart", "summary"] as const;
type UseCartOptions = {
  includeCart?: boolean;
  includeSummary?: boolean;
};

function extractCartFromResponse(response: unknown): Cart | null {
  if (!response || typeof response !== "object") return null;

  const root = response as Record<string, unknown>;
  if (root.cart && typeof root.cart === "object") {
    return root.cart as Cart;
  }

  const payload = root.data;
  if (payload && typeof payload === "object") {
    const payloadObj = payload as Record<string, unknown>;
    if (payloadObj.cart && typeof payloadObj.cart === "object") {
      return payloadObj.cart as Cart;
    }
  }

  return null;
}

function mergeSummaryWithCart(previous: CartSummary | undefined, cart: Cart): CartSummary {
  const previousTotal = parseMoney(previous?.total);
  const previousDiscount = parseMoney(previous?.discount_amount);
  const nextDiscount = parseMoney(cart.discount_amount);

  const merged: CartSummary = {
    ...previous,
    id: previous?.id || cart.id,
    item_count: cart.item_count,
    subtotal: cart.subtotal,
    discount_amount: cart.discount_amount,
    total: cart.total,
    coupon_code: cart.coupon_code ?? null,
    currency: previous?.currency || cart.currency,
    currency_code: previous?.currency_code || cart.currency,
  };

  // Coupon apply/remove responses only carry cart-level totals
  // (subtotal - discount, without shipping/tax). Preserve the full summary
  // total by applying the discount delta to the previously displayed total.
  if (
    previousTotal !== null &&
    previousDiscount !== null &&
    nextDiscount !== null
  ) {
    merged.total = Math.max(
      0,
      previousTotal - (nextDiscount - previousDiscount)
    ).toFixed(2);
  }

  // Drop stale derived strings (formatted_*) so consumers format from the
  // fresh raw values; the follow-up invalidate/refetch restores the
  // authoritative server-formatted values.
  return Object.fromEntries(
    Object.entries(merged).filter(([key]) => !key.startsWith("formatted_"))
  ) as CartSummary;
}

async function fetchCart() {
  const response = await apiFetch<Cart>("/commerce/cart/", { allowGuest: true });
  return response.data;
}

async function fetchCartSummary() {
  const response = await apiFetch<CartSummary>("/commerce/cart/summary/", {
    allowGuest: true,
  });
  return response.data;
}

export function useCart(options?: UseCartOptions) {
  const queryClient = useQueryClient();
  const includeCart = options?.includeCart ?? true;
  const includeSummary = options?.includeSummary ?? true;

  const cartQuery = useQuery({
    queryKey: cartKey,
    queryFn: fetchCart,
    enabled: includeCart,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const cartSummaryQuery = useQuery({
    queryKey: cartSummaryKey,
    queryFn: fetchCartSummary,
    enabled: includeSummary,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const addItem = useMutation({
    mutationFn: async ({ productId, quantity = 1, variantId, customizationData }: AddItemInput) => {
      return apiFetch("/commerce/cart/add/", {
        method: "POST",
        body: {
          product_id: productId,
          quantity,
          variant_id: variantId,
          ...(customizationData ? { customization_data: customizationData } : {}),
        },
        allowGuest: true,
      });
    },
    onMutate: async ({ quantity = 1 }) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previousCart = queryClient.getQueryData<Cart>(cartKey);
      
      if (previousCart) {
        const currentCount = Number(previousCart.item_count) || 0;
        queryClient.setQueryData<Cart>(cartKey, {
          ...previousCart,
          item_count: currentCount + Number(quantity),
        });
      }
      return { previousCart };
    },
    onSuccess: (response) => {
      const data = response && typeof response === "object" && "data" in response
        ? (response as { data: unknown }).data
        : null;
      if (data && typeof data === "object" && "cart" in (data as Record<string, unknown>)) {
        const nextCart = (data as { cart: Cart }).cart;
        if (nextCart) {
          queryClient.setQueryData(cartKey, nextCart);
          queryClient.invalidateQueries({ queryKey: cartSummaryKey });
          return;
        }
      }
      queryClient.invalidateQueries({ queryKey: cartKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKey, context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
  });

  const addBundle = useMutation({
    mutationFn: async ({ bundleId, quantity = 1 }: { bundleId: string; quantity?: number }) => {
      return apiFetch("/commerce/cart/add/", {
        method: "POST",
        body: {
          bundle_id: bundleId,
          quantity,
        },
        allowGuest: true,
      });
    },
    onMutate: async ({ quantity = 1 }) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previousCart = queryClient.getQueryData<Cart>(cartKey);

      if (previousCart) {
        const currentCount = Number(previousCart.item_count) || 0;
        queryClient.setQueryData<Cart>(cartKey, {
          ...previousCart,
          item_count: currentCount + Number(quantity),
        });
      }
      return { previousCart };
    },
    onSuccess: (response) => {
      const data = response && typeof response === "object" && "data" in response
        ? (response as { data: unknown }).data
        : null;
      if (data && typeof data === "object" && "cart" in (data as Record<string, unknown>)) {
        const nextCart = (data as { cart: Cart }).cart;
        if (nextCart) {
          queryClient.setQueryData(cartKey, nextCart);
          queryClient.invalidateQueries({ queryKey: cartSummaryKey });
          return;
        }
      }
      queryClient.invalidateQueries({ queryKey: cartKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKey, context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ itemId, quantity }: UpdateItemInput) => {
      return apiFetch(`/commerce/cart/update/${itemId}/`, {
        method: "POST",
        body: { quantity },
        allowGuest: true,
        suppressError: true,
        suppressErrorStatus: [400],
      });
    },
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<Cart>(cartKey);
      if (!previous) return { previous };

      const nextItems = previous.items.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, quantity };
      });

      const nextItemCount = nextItems.reduce(
        (sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0),
        0
      );

      queryClient.setQueryData<Cart>(cartKey, {
        ...previous,
        items: nextItems,
        item_count: nextItemCount,
      });

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<Cart>(cartKey, context.previous);
      }
    },
    onSuccess: (response) => {
      const data = response && typeof response === "object" && "data" in response
        ? (response as { data: unknown }).data
        : null;
      if (data && typeof data === "object" && "cart" in (data as Record<string, unknown>)) {
        const nextCart = (data as { cart: Cart }).cart;
        if (nextCart) {
          queryClient.setQueryData(cartKey, nextCart);
          queryClient.invalidateQueries({ queryKey: cartSummaryKey });
          return;
        }
      }
      queryClient.invalidateQueries({ queryKey: cartKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      return apiFetch(`/commerce/cart/remove/${itemId}/`, {
        method: "POST",
        allowGuest: true,
      });
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<Cart>(cartKey);
      if (!previous) return { previous };

      const nextItems = previous.items.filter((item) => item.id !== itemId);
      const nextItemCount = nextItems.reduce(
        (sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0),
        0
      );

      const lineTotals = nextItems.map((item) => parseMoney(item.total));
      const canSum = lineTotals.every((value) => value !== null);
      const subtotal = canSum
        ? (lineTotals.reduce((sum, value) => sum + (value ?? 0), 0)).toFixed(2)
        : previous.subtotal;
      
      queryClient.setQueryData<Cart>(cartKey, {
        ...previous,
        items: nextItems,
        item_count: nextItemCount,
        subtotal,
        total: (Math.max(0, (parseMoney(subtotal) ?? 0) - (parseMoney(previous.discount_amount) ?? 0))).toFixed(2),
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(cartKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      return apiFetch(`/commerce/cart/clear/`, {
        method: "POST",
        allowGuest: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
  });

  const applyCoupon = useMutation({
    mutationFn: async ({ code }: ApplyCouponInput) => {
      return apiFetch(`/promotions/coupons/apply/`, {
        method: "POST",
        body: { code },
        allowGuest: true,
      });
    },
    onSuccess: (response) => {
      const nextCart = extractCartFromResponse(response);
      if (nextCart) {
        queryClient.setQueryData<Cart>(cartKey, nextCart);
        queryClient.setQueryData<CartSummary>(cartSummaryKey, (previous) =>
          mergeSummaryWithCart(previous, nextCart)
        );
      }
      queryClient.invalidateQueries({ queryKey: cartKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
  });

  const validateCoupon = useMutation({
    mutationFn: async ({ code, subtotal }: { code: string; subtotal?: string }) => {
      return apiFetch(`/promotions/coupons/validate/`, {
        method: "POST",
        body: subtotal ? { code, subtotal } : { code },
        allowGuest: true,
      });
    },
  });

  const removeCoupon = useMutation({
    mutationFn: async () => {
      return apiFetch(`/commerce/cart/remove_coupon/`, {
        method: "POST",
        allowGuest: true,
      });
    },
    onSuccess: (response) => {
      const nextCart = extractCartFromResponse(response);
      if (nextCart) {
        queryClient.setQueryData<Cart>(cartKey, nextCart);
        queryClient.setQueryData<CartSummary>(cartSummaryKey, (previous) =>
          mergeSummaryWithCart(previous, nextCart)
        );
      }
      queryClient.invalidateQueries({ queryKey: cartKey });
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
  });

  const updateGiftOptions = useMutation({
    mutationFn: async (payload: GiftOptionsInput) => {
      return apiFetch(`/commerce/cart/gift/`, {
        method: "POST",
        body: payload,
        allowGuest: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
  });

  const validateCart = useMutation({
    mutationFn: async () => {
      return apiFetch(`/commerce/cart/validate/`, {
        method: "POST",
        allowGuest: true,
        suppressErrorStatus: [400],
      });
    },
  });

  const lockPrices = useMutation({
    mutationFn: async (durationHours: number = 24) => {
      return apiFetch(`/commerce/cart/lock-prices/`, {
        method: "POST",
        body: { duration_hours: durationHours },
        allowGuest: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartSummaryKey });
    },
  });

  const shareCart = useMutation({
    mutationFn: async (payload: ShareCartInput) => {
      return apiFetch(`/commerce/cart/share/`, {
        method: "POST",
        body: payload,
        allowGuest: true,
      });
    },
  });

  return {
    cartQuery,
    cartSummaryQuery,
    addItem,
    addBundle,
    updateItem,
    removeItem,
    clearCart,
    applyCoupon,
    validateCoupon,
    removeCoupon,
    updateGiftOptions,
    validateCart,
    lockPrices,
    shareCart,
  };
}
