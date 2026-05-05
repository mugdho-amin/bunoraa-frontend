"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { ApiPagination, ProductListItem } from "@/lib/types";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ListingParamValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | undefined;

type ListingRequestParams = Record<string, ListingParamValue>;

function mergeProducts(
  currentProducts: ProductListItem[],
  incomingProducts: ProductListItem[]
) {
  const seenIds = new Set(currentProducts.map((product) => product.id));
  const merged = [...currentProducts];

  incomingProducts.forEach((product) => {
    if (seenIds.has(product.id)) return;
    seenIds.add(product.id);
    merged.push(product);
  });

  return merged;
}

export function InfiniteProductGrid({
  endpoint,
  requestParams,
  initialProducts,
  initialPagination,
  resetKey,
  view = "grid",
  cardStyle = "default",
  className,
  emptyMessage,
}: {
  endpoint: string;
  requestParams: ListingRequestParams;
  initialProducts: ProductListItem[];
  initialPagination?: ApiPagination;
  resetKey: string;
  view?: "grid" | "list";
  cardStyle?: "default" | "minimal";
  className?: string;
  emptyMessage?: string;
}) {
  const [products, setProducts] = React.useState(initialProducts);
  const [pagination, setPagination] = React.useState<ApiPagination | undefined>(
    initialPagination
  );
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [loadMoreError, setLoadMoreError] = React.useState<string | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setProducts(initialProducts);
    setPagination(initialPagination);
    setIsLoadingMore(false);
    setLoadMoreError(null);
  }, [resetKey, initialProducts, initialPagination]);

  const hasMore =
    Boolean(pagination?.next) ||
    Boolean((pagination?.page || 1) < (pagination?.total_pages || 1));
  const totalCount = pagination?.count ?? products.length;

  const loadMore = React.useCallback(async () => {
    if (isLoadingMore || !hasMore || !pagination) return;

    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await apiFetch<ProductListItem[]>(endpoint, {
        params: {
          ...requestParams,
          page: (pagination.page || 1) + 1,
        },
        cache: "no-store",
      });

      const nextProducts = Array.isArray(response.data) ? response.data : [];
      setProducts((currentProducts) => mergeProducts(currentProducts, nextProducts));
      setPagination(response.meta?.pagination ?? pagination);
    } catch (error) {
      setLoadMoreError(
        error instanceof Error ? error.message : "Could not load more products."
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [endpoint, hasMore, isLoadingMore, pagination, requestParams]);

  React.useEffect(() => {
    if (!hasMore || isLoadingMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "280px 0px" }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMore, products.length]);

  return (
    <div className={cn("space-y-6", className)}>
      <ProductGrid
        products={products}
        view={view}
        cardStyle={cardStyle}
        emptyMessage={emptyMessage}
      />

      {products.length ? (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/30 px-4 py-4 text-center">
            <p className="text-sm text-foreground/65">
              Showing {products.length} of {totalCount} products
            </p>
            {hasMore ? (
              <Button
                variant="secondary"
                onClick={() => {
                  void loadMore();
                }}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </Button>
            ) : (
              <p className="text-xs uppercase tracking-[0.16em] text-foreground/45">
                End of results
              </p>
            )}
            {loadMoreError ? (
              <p className="text-sm text-red-600">{loadMoreError}</p>
            ) : null}
          </div>
          {hasMore ? <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" /> : null}
        </div>
      ) : null}
    </div>
  );
}
