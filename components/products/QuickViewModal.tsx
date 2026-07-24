"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { ProductBadge, ProductListItem, ProductVariant } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import Link from "next/link";
import { RatingStars } from "@/components/products/RatingStars";
import { ProductBadges } from "@/components/products/ProductBadges";
import { ProductPrice } from "@/components/products/ProductPrice";
import { VariantSelector } from "@/components/products/VariantSelector";
import { buildProductPath } from "@/lib/productPaths";

type QuickViewData = ProductListItem & {
  badges?: ProductBadge[];
  has_variants?: boolean;
  variants?: ProductVariant[];
};

async function fetchQuickView(slug: string) {
  const response = await apiFetch<QuickViewData>(
    `/catalog/products/${slug}/quick-view/`
  );
  return response.data;
}

export function QuickViewModal({
  slug,
  isOpen,
  onClose,
}: {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["quick-view", slug],
    queryFn: () => fetchQuickView(slug as string),
    enabled: isOpen && !!slug,
  });

  React.useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedVariantId(null);
  }, [slug]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Quick view"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/50"
        aria-label="Close quick view"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl px-2 pb-2 sm:px-4 sm:pb-4 md:pb-0">
        <Card
          variant="bordered"
          className={cn(
            "max-h-[95dvh] overflow-y-auto bg-background p-0",
            "rounded-none md:rounded-lg"
          )}
        >
          <div className="absolute right-4 top-4 z-20">
            <button
              onClick={onClose}
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-all hover:bg-foreground hover:text-background"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {isLoading || isFetching || !data ? (
            <div className="flex h-[500px] items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>Fetching product details...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr]">
              <div className="flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  {data.primary_image ? (
                    <Image
                      src={data.primary_image}
                      alt={data.name}
                      fill
                      priority
                      quality={80}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      No image available
                    </div>
                  )}
                </div>
                <div className="px-6 pb-6 pt-5 sm:px-10 md:px-6 md:pb-6">
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {data.short_description || "Experience the perfect blend of style and comfort with this carefully crafted piece, designed for the modern lifestyle."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col p-6 sm:p-10">
                <div className="mb-6 space-y-2">
                  {data.primary_category_name ? (
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                      {data.primary_category_name}
                    </p>
                  ) : null}
                  <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
                    {data.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <ProductPrice
                      price={data.price}
                      salePrice={data.sale_price}
                      currentPrice={data.current_price}
                      currency={data.currency}
                      priceClassName="text-xl font-bold text-foreground sm:text-2xl"
                      className="flex items-baseline gap-3"
                    />
                    <ProductBadges product={data} badges={data.badges} omitOnSale />
                  </div>
                </div>

                {(data.reviews_count ?? 0) > 0 && (
                  <div className="mb-8 flex items-center gap-3 border-y border-border/40 py-4">
                    <RatingStars rating={data.average_rating || 0} count={data.reviews_count} size="sm" />
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {data.reviews_count} Reviews
                    </span>
                  </div>
                )}

                <div className="mt-auto space-y-4">
                  {data.has_variants && data.variants && data.variants.length > 0 && (
                    <VariantSelector
                      variants={data.variants}
                      selectedVariantId={selectedVariantId}
                      onChange={setSelectedVariantId}
                    />
                  )}
                  <AddToCartButton
                    productId={data.id}
                    variantId={selectedVariantId}
                    variant="primary"
                    size="lg"
                    className="h-14 w-full rounded-none bg-foreground text-[13px] font-bold uppercase tracking-[0.2em] text-background hover:bg-foreground/90"
                  />
                  <Button
                    asChild
                    variant="ghost"
                    size="lg"
                    className="h-14 w-full rounded-none border border-border text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-all"
                  >
                    <Link
                      href={buildProductPath(data)}
                    >
                      View Full Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
