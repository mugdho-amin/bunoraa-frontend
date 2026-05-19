"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { ProductListItem } from "@/lib/types";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardVariant, type ProductCardVariantName } from "@/components/products/ProductCardVariants";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { cn } from "@/lib/utils";

const QuickViewModal = dynamic(
  () => import("@/components/products/QuickViewModal").then((mod) => mod.QuickViewModal),
  {
    ssr: false,
  }
);

function gridColsClass(cols: number, cardStyle: string): string {
  if (cardStyle === "fashion") {
    if (cols === 1) return "grid-cols-1";
    if (cols === 2) return "grid-cols-2";
    if (cols === 6) return "grid-cols-2 lg:grid-cols-6";
    return "grid-cols-2 lg:grid-cols-4";
  }
  if (cardStyle === "minimal") {
    if (cols === 1) return "grid-cols-1";
    if (cols === 2) return "grid-cols-2";
    if (cols === 6) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  }
  if (cols === 1) return "grid-cols-1";
  if (cols === 2) return "grid-cols-2";
  if (cols === 6) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
  return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
}

export function ProductGrid({
  products,
  cols = 4,
  cardVariant,
  cardStyle = "default",
  allowQuickView = true,
  showWishlist = true,
  isLoading = false,
  emptyMessage = "We could not find any products matching your current filters.",
}: {
  products: ProductListItem[];
  cols?: number;
  cardVariant?: ProductCardVariantName;
  cardStyle?: "default" | "minimal" | "fashion";
  allowQuickView?: boolean;
  showWishlist?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}) {
  const [quickViewSlug, setQuickViewSlug] = React.useState<string | null>(null);
  const showQuickViewButton = cardStyle !== "minimal";

  if (isLoading) {
    return (
      <div className={cn("grid gap-4 sm:gap-6", gridColsClass(cols, cardStyle))}>
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 px-3 sm:px-5 py-10 text-center">
        <h3 className="text-lg font-semibold text-foreground">No products found</h3>
        <p className="mt-2 text-sm text-foreground/70">{emptyMessage}</p>
        <p className="mt-3 text-xs text-foreground/50">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid gap-4 sm:gap-6",
          gridColsClass(cols, cardStyle)
        )}
      >
        {products.map((product) => (
          cardVariant ? (
            <ProductCardVariant
              key={product.id}
              product={product}
              variant={cardVariant}
              onQuickView={allowQuickView ? setQuickViewSlug : undefined}
            />
          ) : (
            <ProductCard
              key={product.id}
              product={product}
              variant={
                cardStyle === "fashion"
                  ? "fashion"
                  : cardStyle === "minimal"
                  ? "minimal"
                  : "grid"
              }
              showWishlist={showWishlist}
              showQuickView={showQuickViewButton}
              onQuickView={allowQuickView ? setQuickViewSlug : undefined}
            />
          )
        ))}
      </div>
      {allowQuickView ? (
        <QuickViewModal
          slug={quickViewSlug}
          isOpen={Boolean(quickViewSlug)}
          onClose={() => setQuickViewSlug(null)}
        />
      ) : null}
    </>
  );
}
