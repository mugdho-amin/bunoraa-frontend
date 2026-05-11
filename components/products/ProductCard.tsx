"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductListItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WishlistIconButton } from "@/components/wishlist/WishlistIconButton";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { RatingStars } from "@/components/products/RatingStars";
import { ProductBadges } from "@/components/products/ProductBadges";
import { ProductPrice } from "@/components/products/ProductPrice";
import { cn } from "@/lib/utils";
import { compareItemFromProduct, useCompareToggle } from "@/components/products/compareHelpers";
import { buildProductPath } from "@/lib/productPaths";
import { useUiMessages } from "@/components/i18n/useUiMessages";
import { useMediaUrl } from "@/components/providers/SiteSettingsProvider";

const DEFAULT_CARD_ASPECT_RATIO = 4 / 5;

function parseAspectRatio(value?: string | null) {
  if (!value) return DEFAULT_CARD_ASPECT_RATIO;
  const normalized = String(value).trim();
  if (!normalized) return DEFAULT_CARD_ASPECT_RATIO;

  const parts = normalized.split(/[/:]/).map((part) => Number(part.trim()));
  if (parts.length !== 2) return DEFAULT_CARD_ASPECT_RATIO;
  const [width, height] = parts;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return DEFAULT_CARD_ASPECT_RATIO;
  }
  return width / height;
}

function MinimalProductCard({
  product,
  showWishlist = true,
  showQuickView,
  onQuickView,
}: {
  product: ProductListItem;
  showWishlist?: boolean;
  showQuickView?: boolean;
  onQuickView?: (slug: string) => void;
}) {
  const mediaUrl = useMediaUrl();
  const image =
    typeof product.primary_image === "string"
      ? product.primary_image
      : (product.primary_image as unknown as { image?: string | null })?.image || null;
  // Only prepend mediaUrl if image is relative (doesn't start with http/https or /)
  const fullImageUrl = image && !image.startsWith('http') && !image.startsWith('/') ? `${mediaUrl}${image}` : image;
  const productHref = buildProductPath(product);

  const canQuickView = typeof onQuickView === "function";
  const aspectRatioValue = parseAspectRatio(product.aspect_ratio);
  const gridImageSizes =
    "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
  return (
    <div className="group">
      <div
        className="relative overflow-hidden bg-muted"
        style={{ aspectRatio: aspectRatioValue }}
      >
        {showWishlist ? (
          <WishlistIconButton
            productId={product.id}
            variant="ghost"
            size="lg"
            color="fixed-black"
            className="absolute right-0 top-0 z-20 opacity-100 scale-75 transition sm:scale-100 sm:right-2 sm:top-2"
          />
        ) : null}
        {canQuickView ? (
          <button
            type="button"
            className="absolute inset-0 z-10"
            onClick={() => onQuickView?.(product.slug)}
            aria-label={`Quick view ${product.name}`}
          >
            <span className="sr-only">Quick view</span>
          </button>
        ) : (
          <Link
            href={productHref}
            prefetch={false}
            className="absolute inset-0 z-10"
            aria-label={`View ${product.name}`}
          />
        )}
        {fullImageUrl ? (
          <Image
            src={fullImageUrl}
            alt={product.name}
            fill
            sizes={gridImageSizes}
            quality={72}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        {!product.is_in_stock ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/70">
            Sold Out
          </p>
        ) : null}
        <Link
          href={productHref}
          prefetch={false}
          className="block text-sm font-normal leading-snug text-foreground"
        >
          {product.name}
        </Link>
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          className="text-foreground"
          priceClassName="text-[14px] font-medium sm:text-[16px]"
        />
      </div>
    </div>
  );
}

function InteractiveProductCard({
  product,
  variant = "grid",
  showQuickView,
  onQuickView,
}: {
  product: ProductListItem;
  variant?: "grid" | "list";
  showQuickView?: boolean;
  onQuickView?: (slug: string) => void;
}) {
  const { isInCompare, toggleCompare } = useCompareToggle(product);
  const { t } = useUiMessages("cart");
  const mediaUrl = useMediaUrl();

  const getFullUrl = (img: string | null | undefined) => {
    if (!img) return null;
    return !img.startsWith("http") && !img.startsWith("/") ? `${mediaUrl}${img}` : img;
  };

  const primaryImageUrl = getFullUrl(
    typeof product.primary_image === "string"
      ? product.primary_image
      : (product.primary_image as any)?.image
  );
  const secondaryImageUrl = getFullUrl(product.secondary_image);
  const productHref = buildProductPath(product);

  const aspectRatioValue = parseAspectRatio(product.aspect_ratio);
  const gridImageSizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
  const listImageSizes = "(max-width: 640px) 100vw, 224px";

  return (
    <div
      className={cn(
        "group relative flex flex-col transition-all duration-300",
        variant === "list"
          ? "sm:flex-row sm:items-start gap-6 border-b border-border/50 pb-8 last:border-0"
          : "bg-background rounded-2xl border border-border/40 hover:border-border hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)]"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted transition-all duration-500",
          variant === "list"
            ? "aspect-[4/5] w-full sm:w-56 rounded-xl"
            : "aspect-[var(--aspect-ratio)] rounded-t-2xl",
        )}
        style={{ "--aspect-ratio": aspectRatioValue } as React.CSSProperties}
      >
        <Link href={productHref} className="absolute inset-0 z-10">
          <span className="sr-only">{product.name}</span>
        </Link>

        {/* Images */}
        {primaryImageUrl && (
          <Image
            src={primaryImageUrl}
            alt={product.name}
            fill
            sizes={variant === "list" ? listImageSizes : gridImageSizes}
            quality={85}
            className={cn(
              "object-cover transition-all duration-700 ease-out group-hover:scale-110",
              secondaryImageUrl && "group-hover:opacity-0"
            )}
          />
        )}
        {secondaryImageUrl && (
          <Image
            src={secondaryImageUrl}
            alt={`${product.name} - alternate`}
            fill
            sizes={variant === "list" ? listImageSizes : gridImageSizes}
            quality={85}
            className="object-cover opacity-0 transition-all duration-700 ease-out scale-105 group-hover:scale-110 group-hover:opacity-100"
          />
        )}

        {/* Badges & Overlays */}
        <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5">
          <ProductBadges product={product} omitOnSale />
        </div>

        <WishlistIconButton
          productId={product.id}
          className="absolute right-3 top-3 z-30 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-300"
        />

        {showQuickView && (
          <div className="absolute inset-x-0 bottom-0 z-20 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden sm:block">
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-background/90 backdrop-blur-sm border-0 shadow-lg hover:bg-background"
              onClick={(e) => {
                e.preventDefault();
                onQuickView?.(product.slug);
              }}
            >
              {t("quick_view", "Quick View")}
            </Button>
          </div>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col p-4 sm:p-5", variant === "list" && "sm:p-0")}>
        <div className="mb-2 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/80">
            {product.primary_category_name}
          </p>
          <Link
            href={productHref}
            className="line-clamp-1 text-sm font-medium hover:text-primary transition-colors sm:text-base leading-tight"
          >
            {product.name}
          </Link>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-end justify-between gap-2">
            <ProductPrice
              price={product.price}
              salePrice={product.sale_price}
              currentPrice={product.current_price}
              currency={product.currency}
              priceClassName="text-base font-semibold text-foreground"
            />
            <RatingStars rating={product.average_rating || 0} count={product.reviews_count} size="sm" />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <AddToCartButton
              productId={product.id}
              variant={product.is_in_stock ? "primary" : "secondary"}
              className={cn(
                "h-9 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-sm",
                !product.is_in_stock && "opacity-50"
              )}
              label={product.is_in_stock ? t("add_to_bag", "Add to Bag") : t("out_of_stock", "Sold Out")}
              disabled={!product.is_in_stock}
            />
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg border-border/40 hover:bg-muted transition-colors",
                isInCompare && "text-primary border-primary/20 bg-primary/5"
              )}
              onClick={() => toggleCompare(compareItemFromProduct(product))}
              aria-label={isInCompare ? "Remove from compare" : "Add to compare"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({
  product,
  variant = "grid",
  showWishlist = true,
  showQuickView,
  onQuickView,
}: {
  product: ProductListItem;
  variant?: "grid" | "list" | "minimal";
  showWishlist?: boolean;
  showQuickView?: boolean;
  onQuickView?: (slug: string) => void;
}) {
  if (variant === "minimal") {
    return (
      <MinimalProductCard
        product={product}
        showWishlist={showWishlist}
        showQuickView={showQuickView}
        onQuickView={onQuickView}
      />
    );
  }

  return (
    <InteractiveProductCard
      product={product}
      variant={variant}
      showQuickView={showQuickView}
      onQuickView={onQuickView}
    />
  );
}
