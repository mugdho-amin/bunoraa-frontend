"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductListItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { WishlistIconButton } from "@/components/wishlist/WishlistIconButton";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { RatingStars } from "@/components/products/RatingStars";
import { ProductBadges } from "@/components/products/ProductBadges";
import { ProductPrice } from "@/components/products/ProductPrice";
import { cn } from "@/lib/utils";
import { compareItemFromProduct, useCompareToggle } from "@/components/products/compareHelpers";
import { buildProductPath } from "@/lib/productPaths";
import { VariantPopup } from "@/components/products/VariantPopup";

type VariantAwareAddToCartProps = {
  product: ProductListItem;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  disabled?: boolean;
};

function VariantAwareAddToCart({
  product,
  label: customLabel,
  variant: customVariant,
  size: customSize,
  className,
  disabled: customDisabled,
}: VariantAwareAddToCartProps) {
  const [showPopup, setShowPopup] = React.useState(false);

  if (product.has_variants) {
    const label = customLabel || (product.is_in_stock ? "Add to Bag" : "Sold Out");
    const buttonVariant = customVariant || "primary";
    const buttonSize = customSize || "md";
    const disabled = !product.is_in_stock || Boolean(customDisabled);

    return (
      <>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={className}
          disabled={disabled}
          onClick={() => setShowPopup(true)}
        >
          {label}
        </Button>
        {showPopup && (
          <VariantPopup
            product={product}
            isOpen
            onClose={() => setShowPopup(false)}
          />
        )}
      </>
    );
  }

  return (
    <AddToCartButton
      productId={product.id}
      label={customLabel}
      variant={customVariant}
      size={customSize}
      className={className}
      disabled={customDisabled}
    />
  );
}

export type ProductCardVariantName =
  | "standard"
  | "compact"
  | "horizontal"
  | "overlay"
  | "deal"
  | "quick-add"
  | "minimal"
  | "editorial"
  | "rating-focus"
  | "compare-focus"
  | "inventory-focus"
  | "dense-row"
  | "fashion";

export const PRODUCT_CARD_VARIANTS: Array<{
  id: ProductCardVariantName;
  name: string;
  description: string;
  bestFor: string;
}> = [
  {
    id: "standard",
    name: "Standard Grid",
    description: "Balanced card with media, badges, price, rating, and full actions.",
    bestFor: "Category and search grids",
  },
  {
    id: "fashion",
    name: "Fashion Clean",
    description: "Minimalist, image-first card with hover-swap and overlay actions.",
    bestFor: "Fashion collections and category pages",
  },
  {
    id: "compact",
    name: "Compact Tile",
    description: "Small footprint card that keeps core details visible.",
    bestFor: "Sidebars and mobile carousels",
  },
  {
    id: "horizontal",
    name: "Horizontal List",
    description: "Wide row card with quick scan layout and direct actions.",
    bestFor: "List view and recommendation rails",
  },
  {
    id: "overlay",
    name: "Overlay Hero",
    description: "Image-led card with gradient overlay and concise CTA strip.",
    bestFor: "Editorial modules and homepage highlights",
  },
  {
    id: "deal",
    name: "Deal Spotlight",
    description: "Discount-first card with savings emphasis.",
    bestFor: "Promotions and sale collections",
  },
  {
    id: "quick-add",
    name: "Quick Add",
    description: "Action-heavy card optimized for fast bag additions.",
    bestFor: "Repeat purchase and checkout upsell zones",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Quiet card with essential data and low visual noise.",
    bestFor: "Dense product rows and mixed-content pages",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Story-like presentation with strong typography and media.",
    bestFor: "Landing pages and artisan storytelling",
  },
  {
    id: "rating-focus",
    name: "Rating Focus",
    description: "Trust-forward card prioritizing social proof.",
    bestFor: "Review-heavy products and marketplace ranking pages",
  },
  {
    id: "compare-focus",
    name: "Compare Focus",
    description: "Specification summary card with compare-first action.",
    bestFor: "Decision-support and shortlist pages",
  },
  {
    id: "inventory-focus",
    name: "Inventory Focus",
    description: "Availability-led card highlighting stock and urgency.",
    bestFor: "Drops, low-stock campaigns, and limited batches",
  },
  {
    id: "dense-row",
    name: "Dense Row",
    description: "Ultra-dense row card for high-volume result screens.",
    bestFor: "Power-user search and account/history screens",
  },
];

function resolveImage(product: ProductListItem): string | null {
  if (typeof product.primary_image === "string") return product.primary_image;
  // TODO: Normalize API response, primary_image can be string or {image: string}
  return (product.primary_image as unknown as { image?: string | null })?.image || null;
}

function parseAmount(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function getDiscountPercent(product: ProductListItem): number | null {
  const base = parseAmount(product.price);
  const current = parseAmount(product.current_price || product.sale_price || product.price);
  if (!base || !current || base <= current) return null;
  const percentage = Math.round(((base - current) / base) * 100);
  return percentage > 0 ? percentage : null;
}

function getCategoryLabel(product: ProductListItem): string {
  return product.primary_category_name || "Featured";
}

function StockBadge({ product }: { product: ProductListItem }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
        product.is_in_stock
          ? "bg-success/15 text-success"
          : "bg-error/15 text-error"
      )}
    >
      {product.is_in_stock ? "In stock" : "Out of stock"}
    </span>
  );
}

function QuickViewButton({
  product,
  onQuickView,
  className,
}: {
  product: ProductListItem;
  onQuickView?: (slug: string) => void;
  className?: string;
}) {
  if (!onQuickView) return null;
  return (
    <Button
      size="sm"
      variant="secondary"
      className={cn("min-h-10", className)}
      onClick={() => onQuickView(product.slug)}
    >
      Quick view
    </Button>
  );
}

function BaseMedia({
  product,
  className,
  showBadges = true,
  showWishlist = true,
  onQuickView,
  priority = false,
}: {
  product: ProductListItem;
  className?: string;
  showBadges?: boolean;
  showWishlist?: boolean;
  onQuickView?: (slug: string) => void;
  priority?: boolean;
}) {
  const image = resolveImage(product);
  const productHref = buildProductPath(product);
  const canQuickView = typeof onQuickView === "function";

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-muted", className)}>
      {canQuickView ? (
        <button
          type="button"
          className="absolute inset-0 z-0"
          onClick={() => onQuickView?.(product.slug)}
          aria-label={`Quick view ${product.name}`}
        >
          <span className="sr-only">Quick view</span>
        </button>
      ) : (
        <Link
          href={productHref}
          className="absolute inset-0 z-0"
          aria-label={`View ${product.name}`}
          target="_blank"
          rel="noopener noreferrer"
        />
      )}
      {showWishlist ? (
        <WishlistIconButton
          productId={product.id}
          size="md"
          variant="ghost"
          color="fixed-black"
          className="absolute right-2 top-2 z-20 bg-background/75 backdrop-blur"
        />
      ) : null}
      {showBadges ? (
        <div className="absolute left-2 top-2 z-10">
          <ProductBadges product={product} omitOnSale />
        </div>
      ) : null}
      {image ? (
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          quality={72}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          No image
        </div>
      )}
    </div>
  );
}

function SharedTitle({
  product,
  className,
}: {
  product: ProductListItem;
  className?: string;
}) {
  return (
    <Link
      href={buildProductPath(product)}
      className={cn("block font-semibold leading-snug", className)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {product.name}
    </Link>
  );
}

const FASHION_DEFAULT_ASPECT = 3 / 4;

function parseFashionAspectRatio(value?: string | null) {
  if (!value) return FASHION_DEFAULT_ASPECT;
  const parts = String(value).trim().split(/[/:]/).map(Number);
  if (parts.length !== 2) return FASHION_DEFAULT_ASPECT;
  const [w, h] = parts;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return FASHION_DEFAULT_ASPECT;
  return w / h;
}

function FashionVariant({
  product,
  onQuickView,
  className,
  priority = false,
}: RenderProps & { priority?: boolean }) {
  const primaryImage = resolveImage(product);
  const secondaryImage = product.secondary_image;
  const productHref = buildProductPath(product);
  const aspectRatioValue = parseFashionAspectRatio(product.aspect_ratio);

  return (
    <div className={cn("group flex flex-col", className)}>
      <div
        className="relative overflow-hidden bg-muted rounded-none transition-all duration-500"
        style={{ aspectRatio: aspectRatioValue }}
      >
        <Link href={productHref} className="absolute inset-0 z-10">
          <span className="sr-only">{product.name}</span>
        </Link>
        
        {/* Images with hover swap */}
        {primaryImage && (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            quality={72}
            className={cn(
              "object-cover transition-opacity duration-700 ease-in-out",
              secondaryImage && "group-hover:opacity-0"
            )}
          />
        )}
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.name} secondary`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            decoding="async"
            quality={72}
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100"
          />
        )}

        {/* Badges Overlay */}
        <div className="absolute left-2 top-2 z-20">
          <ProductBadges product={product} omitOnSale />
        </div>

        {/* Wishlist Overlay */}
        <div className="absolute right-2 top-2 z-20 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <WishlistIconButton
            productId={product.id}
            variant="ghost"
            className="h-9 w-9 rounded-full text-foreground shadow-sm hover:bg-background flex items-center justify-center p-0"
          />
        </div>

        {/* Quick View Overlay */}
        {onQuickView && (
          <div className="absolute inset-x-0 bottom-0 z-20 p-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
            <Button
              variant="secondary"
              className="w-full bg-black/90 text-white hover:bg-black border-0 rounded-none h-12 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm"
              onClick={(e) => {
                e.preventDefault();
                onQuickView(product.slug);
              }}
            >
              Quick View
            </Button>
          </div>
        )}
      </div>

      <div className="pt-1 pb-4 space-y-1 text-left">
        <Link
          href={productHref}
          className="block pl-1 text-[13px] font-normal tracking-tight text-foreground/80 hover:text-foreground transition-colors line-clamp-1"
        >
          {product.name}
        </Link>
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          priceClassName="text-[14px] font-bold text-foreground pl-1"
          className="flex items-center justify-start gap-2"
        />
      </div>
    </div>
  );
}

function StandardVariant({
  product,
  isInCompare,
  onToggleCompare,
  onQuickView,
  className,
  priority,
}: RenderProps) {
  return (
    <Card variant="bordered" className={cn("group flex flex-col gap-2 p-4 sm:p-5", className)}>
      <BaseMedia product={product} className="aspect-[4/5]" onQuickView={onQuickView} priority={priority} />
      <div className="space-y-2">
        <p className="pl-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {getCategoryLabel(product)}
        </p>
        <SharedTitle product={product} className="pl-1 text-base sm:text-lg" />
        <RatingStars rating={product.average_rating || 0} count={product.reviews_count} className="pl-1" />
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          className="pl-1"
        />
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2">
        <VariantAwareAddToCart
          product={product}
          label={product.is_in_stock ? "Add to bag" : "Out of stock"}
          disabled={!product.is_in_stock}
          size="sm"
          variant="secondary"
          className="w-full justify-center"
        />
        <Button
          size="sm"
          variant={isInCompare ? "primary" : "secondary"}
          className="w-full justify-center"
          onClick={onToggleCompare}
        >
          {isInCompare ? "Compared" : "Compare"}
        </Button>
      </div>
      <QuickViewButton product={product} onQuickView={onQuickView} className="w-full justify-center" />
    </Card>
  );
}

function CompactVariant({ product, onQuickView, className, priority }: RenderProps) {
  return (
    <Card variant="bordered" className={cn("flex flex-col gap-1.5 p-3", className)}>
      <BaseMedia product={product} className="aspect-square" showBadges={false} onQuickView={onQuickView} priority={priority} />
      <div className="space-y-1">
        <SharedTitle product={product} className="line-clamp-2 pl-1 text-sm" />
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          className="gap-1 pl-1"
          priceClassName="text-base"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <VariantAwareAddToCart
          product={product}
          label={product.is_in_stock ? "Add" : "Out"}
          disabled={!product.is_in_stock}
          size="sm"
          className="w-full justify-center"
        />
        <QuickViewButton product={product} onQuickView={onQuickView} className="w-full justify-center" />
      </div>
    </Card>
  );
}

function HorizontalVariant({
  product,
  isInCompare,
  onToggleCompare,
  onQuickView,
  className,
  priority,
}: RenderProps) {
  return (
    <Card variant="bordered" className={cn("flex flex-col gap-2.5 p-4 sm:flex-row sm:items-center", className)}>
      <BaseMedia product={product} className="h-40 w-full sm:h-36 sm:w-44" onQuickView={onQuickView} priority={priority} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="pl-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{getCategoryLabel(product)}</p>
        <SharedTitle product={product} className="line-clamp-2 pl-1 text-lg" />
        <RatingStars rating={product.average_rating || 0} count={product.reviews_count} className="pl-1" />
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          className="pl-1"
        />
        <div className="mt-1 flex flex-wrap gap-2">
          <VariantAwareAddToCart
            product={product}
            label={product.is_in_stock ? "Add to bag" : "Out of stock"}
            disabled={!product.is_in_stock}
            size="sm"
            variant="secondary"
            className="w-full"
          />
          <Button size="sm" variant={isInCompare ? "primary" : "secondary"} onClick={onToggleCompare}>
            {isInCompare ? "Compared" : "Compare"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function OverlayVariant({ product, onQuickView, className, priority }: RenderProps) {
  const href = buildProductPath(product);

  return (
    <Card
      variant="bordered"
      className={cn("relative overflow-hidden p-0 shadow-soft transition hover:shadow-soft-lg", className)}
    >
      <BaseMedia product={product} className="aspect-[4/5]" showBadges={false} onQuickView={onQuickView} priority={priority} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 text-white space-y-1">
        <p className="pl-1 text-[10px] uppercase tracking-[0.2em] text-white/75">{getCategoryLabel(product)}</p>
        <Link
          href={href}
          className="block pl-1 text-lg font-semibold leading-tight"
          target="_blank"
          rel="noopener noreferrer"
        >
          {product.name}
        </Link>
        <div className="flex items-center justify-between gap-2">
          <ProductPrice
            price={product.price}
            salePrice={product.sale_price}
            currentPrice={product.current_price}
            currency={product.currency}
            priceClassName="text-white pl-1"
            className="text-white [&>*:last-child]:text-white/70"
          />
          <div className="pointer-events-auto flex items-center gap-2">
            <WishlistIconButton productId={product.id} color="fixed-black" variant="default" size="sm" />
            <QuickViewButton product={product} onQuickView={onQuickView} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function DealVariant({ product, onQuickView, className, priority }: RenderProps) {
  const discount = getDiscountPercent(product);

  return (
    <Card variant="modern-gradient" className={cn("flex flex-col gap-4 border border-primary/20 p-4", className)}>
      <BaseMedia product={product} className="aspect-[16/10]" showBadges={false} onQuickView={onQuickView} priority={priority} />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StockBadge product={product} />
          {discount ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              Save {discount}%
            </span>
          ) : null}
        </div>
        <SharedTitle product={product} className="line-clamp-2 pl-1 text-lg" />
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          priceClassName="text-2xl pl-1"
        />
      </div>
      <VariantAwareAddToCart
        product={product}
        label={product.is_in_stock ? "Grab deal" : "Out of stock"}
        disabled={!product.is_in_stock}
        variant="primary-gradient"
        className="w-full justify-center"
      />
    </Card>
  );
}

function QuickAddVariant({ product, onQuickView, className, priority }: RenderProps) {
  return (
    <Card variant="bordered" className={cn("space-y-4 p-4", className)}>
      <BaseMedia product={product} className="aspect-[3/2]" onQuickView={onQuickView} priority={priority} />
      <div className="space-y-2">
        <SharedTitle product={product} className="pl-1 text-lg" />
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          className="pl-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <VariantAwareAddToCart
          product={product}
          label={product.is_in_stock ? "Quick add" : "Out of stock"}
          disabled={!product.is_in_stock}
          variant="primary"
          className="w-full justify-center"
        />
        <QuickViewButton product={product} onQuickView={onQuickView} className="w-full justify-center" />
      </div>
    </Card>
  );
}

function MinimalVariant({ product, onQuickView, className, priority }: RenderProps) {
  return (
    <Card variant="bordered" className={cn("flex flex-col gap-3 p-3", className)}>
      <div className="flex items-center gap-3">
        <BaseMedia
          product={product}
          className="h-20 w-20 shrink-0"
          showBadges={false}
          showWishlist={false}
          onQuickView={onQuickView}
          priority={priority}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="pl-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{getCategoryLabel(product)}</p>
          <SharedTitle product={product} className="line-clamp-2 pl-1 text-sm font-medium" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          priceClassName="text-base"
          className="pl-1"
        />
        <Link
          href={buildProductPath(product)}
          className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"
          target="_blank"
          rel="noopener noreferrer"
        >
          View
        </Link>
      </div>
    </Card>
  );
}

function EditorialVariant({ product, onQuickView, className, priority }: RenderProps) {
  return (
    <Card variant="glass" className={cn("space-y-2 border border-border/70 p-4 sm:p-5", className)}>
      <BaseMedia product={product} className="aspect-[5/4]" showBadges={false} onQuickView={onQuickView} priority={priority} />
      <div className="space-y-2">
        <p className="pl-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Curated pick</p>
        <SharedTitle product={product} className="pl-1 text-xl" />
        <p className="pl-1 line-clamp-2 text-sm text-muted-foreground">
          Handpicked from our latest artisan selections with a focus on quality, finish, and utility.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ProductBadges product={product} />
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          className="pl-1"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildProductPath(product)}
          className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          target="_blank"
          rel="noopener noreferrer"
        >
          Explore product
        </Link>
        <VariantAwareAddToCart
          product={product}
          label={product.is_in_stock ? "Add to bag" : "Out of stock"}
          disabled={!product.is_in_stock}
          size="sm"
          variant="secondary"
        />
      </div>
    </Card>
  );
}

function RatingFocusVariant({
  product,
  isInCompare,
  onToggleCompare,
  onQuickView,
  className,
  priority,
}: RenderProps) {
  return (
    <Card variant="bordered" className={cn("space-y-2 p-4", className)}>
      <BaseMedia product={product} className="aspect-square" onQuickView={onQuickView} priority={priority} />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <RatingStars
            rating={product.average_rating || 0}
            count={product.reviews_count}
            className="pl-1 text-sm"
          />
          <StockBadge product={product} />
        </div>
        <SharedTitle product={product} className="pl-1 text-lg" />
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          className="pl-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <VariantAwareAddToCart
          product={product}
          label={product.is_in_stock ? "Add to bag" : "Out of stock"}
          disabled={!product.is_in_stock}
          size="sm"
          variant="secondary"
          className="w-full justify-center"
        />
        <Button
          size="sm"
          variant={isInCompare ? "primary" : "secondary"}
          className="w-full justify-center"
          onClick={onToggleCompare}
        >
          {isInCompare ? "Compared" : "Compare"}
        </Button>
      </div>
    </Card>
  );
}

function CompareFocusVariant({
  product,
  isInCompare,
  onToggleCompare,
  onQuickView,
  className,
  priority,
}: RenderProps) {
  return (
    <Card variant="bordered" className={cn("flex flex-col gap-2 p-4", className)}>
      <BaseMedia product={product} className="aspect-[4/3]" showBadges={false} onQuickView={onQuickView} priority={priority} />
      <div className="space-y-2">
        <SharedTitle product={product} className="line-clamp-2 pl-1 text-lg" />
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pl-1">
          <span className="rounded-full border border-border bg-card px-2.5 py-1">{getCategoryLabel(product)}</span>
          <span className="rounded-full border border-border bg-card px-2.5 py-1">
            {product.average_rating ? `${product.average_rating.toFixed(1)} stars` : "No rating yet"}
          </span>
          <span className="rounded-full border border-border bg-card px-2.5 py-1">
            {product.is_in_stock ? "Available now" : "Unavailable"}
          </span>
        </div>
        <ProductPrice
          price={product.price}
          salePrice={product.sale_price}
          currentPrice={product.current_price}
          currency={product.currency}
          className="pl-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant={isInCompare ? "primary" : "secondary"}
          className="w-full justify-center"
          onClick={onToggleCompare}
        >
          {isInCompare ? "Compared" : "Add to compare"}
        </Button>
        <Link
          href={buildProductPath(product)}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-card px-3 text-sm font-semibold hover:bg-muted"
          target="_blank"
          rel="noopener noreferrer"
        >
          View specs
        </Link>
      </div>
    </Card>
  );
}

function InventoryFocusVariant({
  product,
  inCart,
  onQuickView,
  className,
  priority,
}: RenderProps) {
  return (
    <Card variant="bordered" className={cn("space-y-1.5 border border-border/80 p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <StockBadge product={product} />
        {inCart ? (
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
            In your bag
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <BaseMedia product={product} className="h-24 w-24 shrink-0" showBadges={false} onQuickView={onQuickView} priority={priority} />
        <div className="min-w-0 space-y-1">
          <SharedTitle product={product} className="line-clamp-2 pl-1 text-base" />
          <ProductPrice
            price={product.price}
            salePrice={product.sale_price}
            currentPrice={product.current_price}
            currency={product.currency}
            priceClassName="text-base pl-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <VariantAwareAddToCart
          product={product}
          label={product.is_in_stock ? "Add one more" : "Notify me"}
          disabled={!product.is_in_stock}
          size="sm"
          className="w-full justify-center"
        />
        <WishlistIconButton
          productId={product.id}
          size="md"
          variant="ghost"
          className="h-10 w-full rounded-xl border border-border bg-card hover:bg-muted"
        />
      </div>
    </Card>
  );
}

function DenseRowVariant({
  product,
  isInCompare,
  onToggleCompare,
  onQuickView,
  className,
  priority,
}: RenderProps) {
  return (
    <Card
      variant="bordered"
      className={cn("grid grid-cols-1 items-center gap-1.5 p-3 sm:grid-cols-[84px_minmax(0,1fr)_auto_auto_auto]", className)}
    >
      <BaseMedia
        product={product}
        className="h-20 w-20"
        showBadges={false}
        showWishlist={false}
        onQuickView={onQuickView}
        priority={priority}
      />
      <div className="min-w-0 space-y-1">
        <SharedTitle product={product} className="line-clamp-1 pl-1 text-sm sm:text-base" />
        <p className="pl-1 text-xs text-muted-foreground">{getCategoryLabel(product)}</p>
      </div>
      <RatingStars
        rating={product.average_rating || 0}
        count={product.reviews_count}
        className="sm:justify-self-center"
      />
      <ProductPrice
        price={product.price}
        salePrice={product.sale_price}
        currentPrice={product.current_price}
        currency={product.currency}
        className="sm:justify-self-end pl-1 sm:pl-0"
        priceClassName="text-base"
      />
      <div className="flex items-center gap-2 sm:justify-self-end">
        <Button size="sm" variant={isInCompare ? "primary" : "secondary"} onClick={onToggleCompare}>
          {isInCompare ? "Compared" : "Compare"}
        </Button>
        <VariantAwareAddToCart
          product={product}
          label={product.is_in_stock ? "Add" : "Out"}
          disabled={!product.is_in_stock}
          size="sm"
        />
      </div>
    </Card>
  );
}

type RenderProps = {
  product: ProductListItem;
  className?: string;
  inCart?: boolean;
  onQuickView?: (slug: string) => void;
  isInCompare: boolean;
  onToggleCompare: () => void;
  priority?: boolean;
};

export function ProductCardVariant({
  product,
  variant,
  className,
  inCart = false,
  onQuickView,
  priority = false,
}: {
  product: ProductListItem;
  variant: ProductCardVariantName;
  className?: string;
  inCart?: boolean;
  onQuickView?: (slug: string) => void;
  priority?: boolean;
}) {
  const { isInCompare, toggleCompare } = useCompareToggle(product);
  const renderProps: RenderProps = {
    product,
    className,
    inCart,
    onQuickView,
    isInCompare,
    onToggleCompare: () => toggleCompare(compareItemFromProduct(product)),
    priority,
  };

  switch (variant) {
    case "fashion":
      return <FashionVariant {...renderProps} priority={priority} />;
    case "standard":
      return <StandardVariant {...renderProps} />;
    case "compact":
      return <CompactVariant {...renderProps} />;
    case "horizontal":
      return <HorizontalVariant {...renderProps} />;
    case "overlay":
      return <OverlayVariant {...renderProps} />;
    case "deal":
      return <DealVariant {...renderProps} />;
    case "quick-add":
      return <QuickAddVariant {...renderProps} />;
    case "minimal":
      return <MinimalVariant {...renderProps} />;
    case "editorial":
      return <EditorialVariant {...renderProps} />;
    case "rating-focus":
      return <RatingFocusVariant {...renderProps} />;
    case "compare-focus":
      return <CompareFocusVariant {...renderProps} />;
    case "inventory-focus":
      return <InventoryFocusVariant {...renderProps} />;
    case "dense-row":
      return <DenseRowVariant {...renderProps} />;
    default:
      return <StandardVariant {...renderProps} />;
  }
}
