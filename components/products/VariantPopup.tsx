"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { ProductListItem, ProductVariant } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductPrice } from "@/components/products/ProductPrice";
import { VariantSelector } from "@/components/products/VariantSelector";
import Link from "next/link";
import { buildProductPath } from "@/lib/productPaths";
import { useMediaUrl } from "@/components/providers/SiteSettingsProvider";

type VariantPopupData = ProductListItem & {
  variants?: ProductVariant[];
  has_variants?: boolean;
};

async function fetchVariants(slug: string) {
  const response = await apiFetch<VariantPopupData>(
    `/catalog/products/${slug}/quick-view/`
  );
  return response.data;
}

export function VariantPopup({
  product,
  isOpen,
  onClose,
}: {
  product: ProductListItem;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const mediaUrl = useMediaUrl();

  const { data, isLoading } = useQuery({
    queryKey: ["variant-popup", product.slug],
    queryFn: () => fetchVariants(product.slug),
    enabled: isOpen,
  });

  React.useEffect(() => {
    setSelectedVariantId(null);
  }, [product.slug, isOpen]);

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

  if (!isOpen) return null;

  const imageUrl = (() => {
    const img = typeof product.primary_image === "string"
      ? product.primary_image
      : (product.primary_image as unknown as { image?: string | null })?.image;
    if (!img) return null;
    return !img.startsWith("http") && !img.startsWith("/") ? `${mediaUrl}${img}` : img;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Select variant for ${product.name}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl border border-border/60 bg-card shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-all hover:bg-foreground hover:text-background"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-muted">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    priority
                    quality={80}
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4 p-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground leading-tight line-clamp-2">
                    {product.name}
                  </h3>
                  <ProductPrice
                    price={product.price}
                    salePrice={product.sale_price}
                    currentPrice={product.current_price}
                    currency={product.currency}
                    priceClassName="text-lg font-bold text-foreground"
                  />
                </div>

                {data?.has_variants && data?.variants && data.variants.length > 0 && (
                  <VariantSelector
                    variants={data.variants}
                    selectedVariantId={selectedVariantId}
                    onChange={setSelectedVariantId}
                  />
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <AddToCartButton
                    productId={product.id}
                    variantId={selectedVariantId}
                    size="lg"
                    className="h-11 w-full rounded-xl bg-foreground text-[11px] font-bold uppercase tracking-wider text-background hover:bg-foreground/90"
                  />
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="h-11 w-full rounded-xl border-border/60 text-[11px] font-bold uppercase tracking-wider"
                  >
                    <Link href={buildProductPath(product)} onClick={onClose}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
