"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import type {
  Bundle,
  ShippingRateResponse,
  ShippingMethodOption,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { RatingStars } from "@/components/products/RatingStars";
import { ProductImageZoom } from "@/components/products/ProductImageZoom";
import { AddBundleToCart } from "@/components/bundles/AddBundleToCart";
import { useToast } from "@/components/ui/ToastProvider";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { useUiMessages } from "@/components/i18n/useUiMessages";
import { getBundleReviewSummary } from "@/lib/bundles";
import { getBundleItemCount, getBundleShippingItemCount } from "@/lib/bundleQuantities";
import { formatMoney } from "@/lib/money";
import { buildProductPath } from "@/lib/productPaths";
import { cn } from "@/lib/utils";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChevronDown, Info, RefreshCw, Truck, X } from "lucide-react";

const BUNDLE_ASPECT_RATIO = 4 / 5;

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveDeliveryLabel(method: ShippingMethodOption | null | undefined) {
  if (!method) return null;
  if (method.delivery_estimate) return method.delivery_estimate;
  if (typeof method.min_days === "number" && typeof method.max_days === "number") {
    if (method.min_days === method.max_days) return `${method.min_days} day delivery`;
    return `${method.min_days}-${method.max_days} day delivery`;
  }
  if (typeof method.min_days === "number") return `${method.min_days}+ day delivery`;
  if (typeof method.max_days === "number") return `Up to ${method.max_days} days`;
  return null;
}

function CollapsibleSection({
  id,
  title,
  icon: Icon,
  children,
  defaultExpanded = false,
}: {
  id: string;
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div id={id} className="border-b border-border/60">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-primary"
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-muted-foreground" />}
          <h2 className="text-sm font-bold uppercase tracking-[0.15em]">{title}</h2>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform duration-300",
            isExpanded && "rotate-180 text-primary"
          )}
        />
      </button>
      <div
        id={`${id}-content`}
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-5 pt-1 text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function BundleShippingEstimatorModal({
  bundle,
  quantity,
  isOpen,
  onClose,
}: {
  bundle: Bundle;
  quantity: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { push } = useToast();
  const [country, setCountry] = React.useState("Bangladesh");
  const [state, setState] = React.useState("Dhaka");
  const [postalCode] = React.useState("");
  const [result, setResult] = React.useState<ShippingRateResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  const safeQuantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);
  const subtotal = (toNumber(bundle.price) ?? 0) * safeQuantity;
  const productIds = (bundle.items || [])
    .map((line) => line.product?.id)
    .filter((id): id is string => Boolean(id));
  const pieceCount = getBundleShippingItemCount(bundle, safeQuantity);

  const orderedMethods = React.useMemo(() => {
    if (!result?.methods?.length) return [] as ShippingMethodOption[];
    return [...result.methods].sort((a, b) => {
      const aRate = toNumber(a.rate) ?? Number.POSITIVE_INFINITY;
      const bRate = toNumber(b.rate) ?? Number.POSITIVE_INFINITY;
      return aRate - bRate;
    });
  }, [result]);

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<ShippingRateResponse>("/shipping/calculate/", {
        method: "POST",
        body: {
          country,
          state: state || undefined,
          postal_code: postalCode || undefined,
          subtotal,
          item_count: pieceCount,
          product_ids: productIds,
        },
      });
      setResult(response.data || null);
    } catch {
      push("Could not estimate shipping.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delivery & Shipping Estimator"
      description="Estimate delivery dates and rates based on your location."
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="Country"
          />
          <input
            value={state}
            onChange={(event) => setState(event.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="State"
          />
          <Button
            size="md"
            variant="primary"
            onClick={handleEstimate}
            disabled={loading}
            className="h-11 shadow-sm"
          >
            {loading ? "Calculating..." : "Calculate Rates"}
          </Button>
        </div>

        {orderedMethods.length > 0 ? (
          <div className="space-y-3 pt-2 animate-in fade-in duration-300">
            {orderedMethods.map((method) => (
              <div
                key={method.code || method.name}
                className="group relative flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/60 hover:border-primary/40 transition-all shadow-sm"
              >
                <div className="space-y-1">
                  <p className="font-bold text-sm text-foreground">{method.name}</p>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    {resolveDeliveryLabel(method)}
                    {method.is_express && (
                      <span className="text-accent">• Express</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-base">{method.rate_display || method.rate}</p>
                </div>
              </div>
            ))}
          </div>
        ) : result ? (
          <div className="p-4 rounded-xl bg-muted/20 text-center text-xs text-muted-foreground">
            No shipping options available for this location.
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function BundleReviews({
  bundle,
}: {
  bundle: Bundle;
}) {
  const lines = bundle.items || [];
  const summary = getBundleReviewSummary(bundle);
  const hasReviews = summary.totalCount > 0;

  return (
    <Card variant="bordered" className="p-6 sm:p-8">
      <div className="space-y-3">
        <h3 className="text-xl font-bold tracking-tight sm:text-2xl">Customer Reviews</h3>
        {hasReviews ? (
          <div className="flex items-center gap-4">
            <span className="text-4xl font-black text-foreground">{summary.averageRating.toFixed(1)}</span>
            <div className="space-y-1">
              <RatingStars rating={summary.averageRating} showCount={false} size="lg" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {summary.totalCount} Reviews across {lines.length} {lines.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No reviews yet — share your experience on the items inside this bundle and ratings will show here.
          </p>
        )}
      </div>

      <div className="mt-8 space-y-3">
        {lines.map((line) => {
          const { product } = line;
          if (!product) return null;
          const count = Number(product.reviews_count) || 0;
          const rating = Number(product.average_rating) || 0;
          return (
            <Link
              key={product.id ?? line.id}
              href={buildProductPath(product)}
              className="group flex items-center gap-3 rounded-xl border border-border/60 p-3 transition hover:border-primary/40 hover:bg-muted/20"
            >
              {product.primary_image ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={product.primary_image as string}
                    alt={product.name}
                    fill
                    quality={70}
                    sizes="56px"
                    className="object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-lg bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium group-hover:text-primary">{product.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <RatingStars rating={rating} showCount={false} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {count} {count === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-primary">
                Read reviews →
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

export function BundleDetailClient({ bundle }: { bundle: Bundle }) {
  const { t } = useUiMessages("cart");
  const [quantity, setQuantity] = React.useState(1);
  const [estimatorOpen, setEstimatorOpen] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  const currency = bundle.currency || "BDT";
  const price = formatMoney(bundle.price, currency);
  const worth = formatMoney(bundle.value, currency);
  const savings = formatMoney(bundle.savings, currency);
  const hasSavings = Boolean(bundle.savings && parseFloat(bundle.savings) > 0);
  const availableUnits = bundle.available_units;
  const soldOut = typeof availableUnits === "number" && availableUnits <= 0;
  const lowStock =
    typeof availableUnits === "number" && availableUnits > 0 && availableUnits <= 3;
  const reviewSummary = React.useMemo(() => getBundleReviewSummary(bundle), [bundle]);

  const siteSettings = useSiteSettings();
  const currencySymbol = siteSettings?.currency_symbol || "৳";
  const freeShippingThreshold = siteSettings?.free_shipping_threshold || 5000;
  const shippingText = freeShippingThreshold > 0
    ? `Free standard delivery on orders over ${currencySymbol}${freeShippingThreshold.toLocaleString()}. Express options available at checkout.`
    : "Express delivery options available at checkout.";

  const itemLines = bundle.items || [];
  const hasItems = itemLines.length > 0;
  const itemCount = getBundleItemCount(bundle);

  return (
    <div className="space-y-10 pb-32 md:pb-12">
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        {/* Media */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-muted">
            <ProductImageZoom
              src={bundle.image || ""}
              alt={bundle.name}
              priority
              aspectRatio={BUNDLE_ASPECT_RATIO}
              onZoomClick={() => setLightboxOpen(true)}
            />
            {soldOut ? (
              <Badge variant="error" className="absolute left-4 top-4 z-10">
                Sold out
              </Badge>
            ) : lowStock ? (
              <Badge variant="warning" className="absolute left-4 top-4 z-10">
                Only {availableUnits} left
              </Badge>
            ) : null}
          </div>

          {lightboxOpen && bundle.image ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/98 backdrop-blur-xl animate-in fade-in duration-300">
              <button
                type="button"
                className="absolute right-6 top-6 z-10 rounded-full bg-muted/80 p-3 text-muted-foreground transition hover:text-foreground"
                onClick={() => setLightboxOpen(false)}
              >
                <X size={24} />
              </button>
              <div className="relative max-h-[85vh] max-w-[95vw]">
                <TransformWrapper
                  initialScale={1}
                  minScale={1}
                  maxScale={8}
                  centerOnInit
                  wheel={{ wheelDisabled: false }}
                  pinch={{ disabled: false }}
                  doubleClick={{ disabled: false, mode: "zoomIn" }}
                >
                  <TransformComponent
                    wrapperClass="!w-full !h-full"
                    contentClass="!w-full !h-full"
                  >
                    <Image
                      src={bundle.image}
                      alt={bundle.name}
                      width={1200}
                      height={1500}
                      quality={85}
                      className="max-h-[85vh] object-contain"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </TransformComponent>
                </TransformWrapper>
              </div>
            </div>
          ) : null}
        </div>

        {/* Info + purchase */}
        <div className="space-y-6 lg:sticky lg:top-[var(--header-offset)]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Bundle
              </span>
              {bundle.is_featured ? <Badge variant="accent">Featured</Badge> : null}
            </div>
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {bundle.name}
            </h1>
            <div className="flex items-center gap-2">
              <RatingStars rating={reviewSummary.averageRating} showCount={false} size="sm" />
              <a
                href="#reviews"
                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground underline-offset-4 transition-all hover:text-primary hover:underline"
              >
                {reviewSummary.totalCount} Reviews
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{itemCount} items</Badge>
            </div>
          </div>

          <Card variant="elevated" className="p-5">
            <dl>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-muted-foreground">Items worth</dt>
                <dd className="text-sm text-muted-foreground line-through">
                  {worth}
                </dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <dt className="text-sm font-medium">Bundle price</dt>
                <dd className="text-2xl font-semibold text-primary">{price}</dd>
              </div>
              {hasSavings ? (
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">You save</dt>
                  <dd className="text-sm font-semibold text-success">{savings}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-4">
              {soldOut ? (
                <p className="text-sm text-error">
                  This bundle is currently out of stock.
                </p>
              ) : lowStock ? (
                <p className="mb-3 text-sm text-warning">
                  Only {availableUnits} bundles left — order before they run out.
                </p>
              ) : null}
              <AddBundleToCart
                bundleId={bundle.id}
                bundleName={bundle.name}
                availableUnits={bundle.available_units}
                quantity={quantity}
                onQuantityChange={setQuantity}
                className="mt-1"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="h-11 gap-2 rounded-xl border-border/60 text-xs font-bold uppercase tracking-wider"
                onClick={() => setEstimatorOpen(true)}
              >
                <Truck size={16} />
                Calculate Delivery
              </Button>
              <Button
                asChild
                variant="secondary"
                size="md"
                className="h-11 gap-2 rounded-xl border-border/60 text-xs font-bold uppercase tracking-wider"
              >
                <a href="#bundle-contents">
                  <Info size={16} />
                  What&apos;s Inside
                </a>
              </Button>
            </div>

            <ul className="mt-5 space-y-2 border-t pt-4 text-xs text-muted-foreground">
              <li>Bundle ships together as one kit</li>
              <li>Availability is based on the items inside</li>
              <li>
                <Link href="/cart/" className="underline-offset-2 hover:underline">
                  View my bag
                </Link>
              </li>
            </ul>
          </Card>

          <div className="border-t border-border/60 pt-2">
            <CollapsibleSection id="the-bundle" title="The Bundle" icon={Info}>
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">{bundle.description}</p>
                {hasItems ? (
                  <ul className="grid gap-1.5 text-xs text-muted-foreground">
                    {itemLines.map((line, index) => (
                      <li key={line.product?.id ?? index} className="flex items-center justify-between gap-3">
                        <span className="truncate">{line.product?.name}</span>
                        <span className="shrink-0 tabular-nums">× {line.quantity}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="shipping" title="Shipping & Returns" icon={RefreshCw}>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Truck size={18} className="shrink-0 text-primary" />
                  <p className="text-sm">{shippingText}</p>
                </div>
                <div className="flex gap-3">
                  <RefreshCw size={18} className="shrink-0 text-primary" />
                  <p className="text-sm">
                    Enjoy free returns within 7 days. Ensure tags are attached and items are in original condition.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEstimatorOpen(true)}
                  className="inline-flex items-center gap-1.5 pt-1 text-xs font-bold uppercase tracking-wider text-primary underline underline-offset-4"
                >
                  Estimate delivery date & rates
                </button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="details" title="Details" icon={Info}>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{itemCount} items</span>
                  <span className="font-semibold">{t("items", "Items")}</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Bundle value</span>
                  <span className="font-semibold">{worth}</span>
                </li>
                {bundle.discount_percentage ? (
                  <li className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-semibold">{bundle.discount_percentage}%</span>
                  </li>
                ) : null}
              </ul>
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* What's inside */}
      <section
        id="bundle-contents"
        aria-labelledby="bundle-contents-title"
        className="scroll-mt-24 border-t border-border/60 pt-10"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-eyebrow">What&apos;s inside</p>
            <h2 id="bundle-contents-title" className="section-title">
              {bundle.name}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {itemCount} items · worth {worth}
          </p>
        </div>

        {hasItems ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {itemLines.map((line, index) => {
              const { product } = line;
              if (!product) return null;
              const unitPrice = parseFloat(product.current_price || "0");
              return (
                <Card key={product.id ?? index} variant="bordered" className="p-3">
                  <Link
                    href={buildProductPath(product)}
                    className="flex items-center gap-3"
                  >
                    {product.primary_image ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={product.primary_image as string}
                          alt={product.name}
                          fill
                          quality={70}
                          sizes="64px"
                          className="object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Qty {line.quantity}
                      </p>
                      {unitPrice > 0 ? (
                        <p className="mt-1 text-xs font-semibold">
                          {formatMoney(product.current_price, currency)}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </Card>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Bundle details are available, but the product list is not exposed via API yet.
          </p>
        )}
      </section>

      {/* Reviews */}
      <section id="reviews" className="scroll-mt-24 pt-10">
        <BundleReviews bundle={bundle} />
      </section>

      {/* Delivery Estimator Modal */}
      <BundleShippingEstimatorModal
        bundle={bundle}
        quantity={quantity}
        isOpen={estimatorOpen}
        onClose={() => setEstimatorOpen(false)}
      />

      {/* Mobile sticky purchase bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-3 px-[var(--page-gutter)] py-3">
          <div className="min-w-0 shrink-0">
            <p className="text-lg font-semibold text-primary">{price}</p>
          </div>
          <AddBundleToCart
            bundleId={bundle.id}
            bundleName={bundle.name}
            availableUnits={bundle.available_units}
            compact
            quantity={quantity}
            onQuantityChange={setQuantity}
            className="min-w-0 flex-1"
          />
        </div>
      </div>
    </div>
  );
}
