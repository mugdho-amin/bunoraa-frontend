import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import type { ApiMeta, WishlistItem } from "@/lib/types";

type WishlistResponse = {
  data?: WishlistItem[];
  results?: WishlistItem[];
  items?: WishlistItem[];
  meta?: ApiMeta;
};

const wishlistKey = ["wishlist"] as const;

type WishlistQueryData = {
  data: WishlistItem[];
  meta: ApiMeta;
};

type WishlistMutationPayload = {
  item?: WishlistItem;
  wishlist?: {
    item_count?: number;
    [key: string]: unknown;
  };
  data?: {
    item?: WishlistItem;
    wishlist?: {
      item_count?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function buildPagination(count: number) {
  return {
    count,
    next: null,
    previous: null,
    page: 1,
    page_size: count,
    total_pages: count > 0 ? 1 : 0,
  };
}

function normalizeMeta(meta: ApiMeta | undefined, count: number): ApiMeta {
  return {
    ...(meta || {}),
    pagination: {
      ...(meta?.pagination || buildPagination(count)),
      count,
    },
  };
}

function normalizeWishlistResponse(
  payload: WishlistItem[] | WishlistResponse | null | undefined,
  meta?: ApiMeta
): WishlistQueryData {
  if (Array.isArray(payload)) {
    const count = meta?.pagination?.count ?? payload.length;
    return {
      data: payload,
      meta: normalizeMeta(meta, count),
    };
  }

  if (payload && typeof payload === "object") {
    const items = payload.data || payload.results || payload.items || [];
    const count = payload.meta?.pagination?.count ?? meta?.pagination?.count ?? items.length;
    return {
      data: items,
      meta: normalizeMeta(payload.meta || meta, count),
    };
  }

  return {
    data: [],
    meta: normalizeMeta(meta, 0),
  };
}

function getMutationPayload(response: unknown): WishlistMutationPayload | null {
  if (!response || typeof response !== "object") return null;
  const root = response as WishlistMutationPayload;
  if (root.item || root.wishlist) return root;
  if (root.data && typeof root.data === "object") return root.data;
  return null;
}

function getVariantId(item: WishlistItem) {
  const variant = (item as WishlistItem & { variant?: { id?: string | null } | null }).variant;
  return variant?.id || null;
}

function isSameWishlistItem(item: WishlistItem, productId: string, variantId?: string | null) {
  return item.product_id === productId && getVariantId(item) === (variantId || null);
}

async function fetchWishlist() {
  const response = await apiFetch<WishlistItem[] | WishlistResponse>(
    "/commerce/wishlist/",
    {
      allowGuest: true,
    }
  );

  return normalizeWishlistResponse(response.data, response.meta);
}

export function useWishlist(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;

  const wishlistQuery = useQuery({
    queryKey: wishlistKey,
    queryFn: fetchWishlist,
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 429) return false;
      return failureCount < 2;
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      return apiFetch(`/commerce/wishlist/remove/${itemId}/`, {
        method: "POST",
        allowGuest: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKey });
    },
  });

  const moveToCart = useMutation({
    mutationFn: async (itemId: string) => {
      return apiFetch(`/commerce/wishlist/move-to-cart/${itemId}/`, {
        method: "POST",
        allowGuest: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKey });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart", "summary"] });
    },
  });

  const addItem = useMutation({
    mutationFn: async ({
      productId,
      variantId,
    }: {
      productId: string;
      variantId?: string | null;
    }) => {
      return apiFetch(`/commerce/wishlist/`, {
        method: "POST",
        body: {
          product_id: productId,
          variant_id: variantId || undefined,
        },
        allowGuest: true,
      });
    },
    onSuccess: (response, variables) => {
      const payload = getMutationPayload(response);
      if (payload?.item) {
        queryClient.setQueryData<WishlistQueryData>(wishlistKey, (previous) => {
          const current = previous || normalizeWishlistResponse([]);
          const nextItems = current.data.some((item) =>
            isSameWishlistItem(item, variables.productId, variables.variantId)
          )
            ? current.data.map((item) =>
                isSameWishlistItem(item, variables.productId, variables.variantId)
                  ? payload.item as WishlistItem
                  : item
              )
            : [payload.item as WishlistItem, ...current.data];
          const nextCount = payload.wishlist?.item_count ?? nextItems.length;

          return {
            data: nextItems,
            meta: normalizeMeta(current.meta, nextCount),
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: wishlistKey });
    },
  });

  return {
    wishlistQuery,
    addItem,
    removeItem,
    moveToCart,
  };
}
