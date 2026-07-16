"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductListItem } from "@/lib/types";
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
import { ProductCardVariant } from "@/components/products/ProductCardVariants";

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
  onQuickView,
  priority = false,
}: {
  product: ProductListItem;
  showWishlist?: boolean;
  onQuickView?: (slug: string) => void;
  priority?: boolean;
}) {
  const mediaUrl = useMediaUrl();
  const image =
    typeof product.primary_image === "string"
      ? product.primary_image
      // TODO: Normalize API response, primary_image can be string or {image: string}
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
        className="relative overflow-hidden rounded-xl bg-muted sm:rounded-2xl"
        style={{ aspectRatio: aspectRatioValue }}
      >
        {showWishlist ? (
          <WishlistIconButton
            productId={product.id}
            variant="ghost"
            size="lg"
            color="fixed-black"
            className="absolute right-1 top-1 z-20 scale-90 opacity-100 transition sm:right-2 sm:top-2 sm:scale-100"
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
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            className="h-full w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-foreground/20">
            <span className="text-xs font-medium uppercase tracking-wider">No image</span>
          </div>
        )}
      </div>
      <div className="mt-2 space-y-1 px-0.5">
        {!product.is_in_stock ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/55 sm:text-[11px]">
            Sold Out
          </p>
        ) : null}
        <Link
          href={productHref}
          prefetch={false}
          className="block text-[13px] font-medium leading-snug text-foreground transition-colors hover:text-primary sm:text-sm line-clamp-2"
        >
          {product.name}
        </Link>
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          className="text-foreground"
          priceClassName="text-[13px] font-semibold sm:text-[15px]"
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
  priority = false,
}: {
  product: ProductListItem;
  variant?: "grid" | "list";
  showQuickView?: boolean;
  onQuickView?: (slug: string) => void;
  priority?: boolean;
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
      // TODO: Normalize API response, primary_image can be string or {image: string}
      : (product.primary_image as unknown as { image?: string | null })?.image
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
          ? "gap-4 border-b border-border/50 pb-6 last:border-0 sm:flex-row sm:items-start sm:gap-6 sm:pb-8"
          : "rounded-2xl border border-border/40 bg-card shadow-xs hover:border-border hover:shadow-soft-lg"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-muted transition-all duration-500",
          variant === "list"
            ? "aspect-[4/5] w-full rounded-xl sm:w-56"
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
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            className={cn(
              "object-cover transition-all duration-700 ease-out-expo group-hover:scale-105",
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
            loading="lazy"
            decoding="async"
            className="scale-105 object-cover opacity-0 transition-all duration-700 ease-out-expo group-hover:scale-105 group-hover:opacity-100"
          />
        )}

        {/* Badges & Overlays */}
        <div className="absolute left-2 top-2 z-20 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          <ProductBadges product={product} omitOnSale />
        </div>

        {/* Wishlist always visible on mobile (no hover) */}
        <WishlistIconButton
          productId={product.id}
          className="absolute right-2 top-2 z-30 opacity-100 transition-all duration-300 sm:right-3 sm:top-3 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
        />

        {/* Quick view: visible on mobile as subtle chip; full bar on desktop hover */}
        {showQuickView && (
          <>
            <div className="absolute inset-x-0 bottom-0 z-20 p-2 sm:hidden">
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-full border-0 bg-background/90 text-[11px] font-semibold uppercase tracking-wider shadow-soft backdrop-blur-md"
                onClick={(e) => {
                  e.preventDefault();
                  onQuickView?.(product.slug);
                }}
              >
                {t("quick_view", "Quick View")}
              </Button>
            </div>
            <div className="absolute inset-x-0 bottom-0 z-20 hidden translate-y-full p-3 transition-transform duration-300 ease-out-expo group-hover:translate-y-0 sm:block">
              <Button
                variant="secondary"
                size="sm"
                className="w-full border-0 bg-background/90 shadow-lg backdrop-blur-sm hover:bg-background"
                onClick={(e) => {
                  e.preventDefault();
                  onQuickView?.(product.slug);
                }}
              >
                {t("quick_view", "Quick View")}
              </Button>
            </div>
          </>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-5 sm:pb-5 sm:pt-2.5", variant === "list" && "sm:p-0")}>
        <div className="mb-2 space-y-1">
          {product.primary_category_name ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/45">
              {product.primary_category_name}
            </p>
          ) : null}
          <Link
            href={productHref}
            className="line-clamp-2 text-sm font-medium leading-tight transition-colors hover:text-primary sm:line-clamp-1 sm:text-base"
          >
            {product.name}
          </Link>
        </div>

        <div className="mt-auto space-y-3 sm:space-y-4">
          <div className="flex items-end justify-between gap-2">
            <ProductPrice
              price={product.price}
              salePrice={product.sale_price}
              currentPrice={product.current_price}
              currency={product.currency}
              priceClassName="text-sm font-semibold text-foreground sm:text-base"
            />
            <RatingStars rating={product.average_rating || 0} count={product.reviews_count} size="sm" />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <AddToCartButton
              productId={product.id}
              variant={product.is_in_stock ? "primary" : "secondary"}
              className={cn(
                "h-10 min-h-10 text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-xs sm:h-9",
                !product.is_in_stock && "opacity-50"
              )}
              label={product.is_in_stock ? t("add_to_bag", "Add to Bag") : t("out_of_stock", "Sold Out")}
              disabled={!product.is_in_stock}
            />
            <Button
              variant="secondary"
              size="icon-sm"
              className={cn(
                "h-10 w-10 min-h-10 min-w-10 rounded-xl border-border/40 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9",
                isInCompare && "border-primary/20 bg-primary/5 text-primary"
              )}
              onClick={() => toggleCompare(compareItemFromProduct(product))}
              aria-label={isInCompare ? "Remove from compare" : "Add to compare"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
  priority = false,
}: {
  product: ProductListItem;
  variant?: "grid" | "list" | "minimal" | "fashion";
  showWishlist?: boolean;
  showQuickView?: boolean;
  onQuickView?: (slug: string) => void;
  priority?: boolean;
}) {
  if (variant === "fashion") {
    return (
      <ProductCardVariant
        product={product}
        variant="fashion"
        onQuickView={onQuickView}
        priority={priority}
      />
    );
  }

  if (variant === "minimal") {
    return (
      <MinimalProductCard
        product={product}
        showWishlist={showWishlist}
        onQuickView={onQuickView}
        priority={priority}
      />
    );
  }

  return (
    <InteractiveProductCard
      product={product}
      variant={variant === "list" ? "list" : "grid"}
      showQuickView={showQuickView}
      onQuickView={onQuickView}
      priority={priority}
    />
  );
}
