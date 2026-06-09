"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  ProductDetail,
  ProductListItem,
  Review,
  ReviewStatistics,
  ShippingRateResponse,
  ShippingMethodOption,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { RatingStars } from "@/components/products/RatingStars";
import { ProductPrice } from "@/components/products/ProductPrice";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { addRecentlyViewed } from "@/lib/recentlyViewed";
import { cn } from "@/lib/utils";
import { RecentlyViewedSection } from "@/components/products/RecentlyViewedSection";
import { ProductGrid } from "@/components/products/ProductGrid";
import { buildProductCategoryTrail, buildProductPath } from "@/lib/productPaths";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, Info, Truck, RefreshCw } from "lucide-react";
import { getColorSwatch } from "@/lib/colors";

type Variant = NonNullable<ProductDetail["variants"]>[number];
type VariantOptionMap = Record<string, string>;

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDateLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getVariantOptionMap(variant: Variant | null | undefined): VariantOptionMap {
  const map: VariantOptionMap = {};
  if (!variant?.option_values?.length) return map;
  variant.option_values.forEach((optionValue) => {
    if (!optionValue.option?.slug || !optionValue.value) return;
    map[optionValue.option.slug] = optionValue.value;
  });
  return map;
}

function getVariantInStock(variant: Variant | null | undefined, product: ProductDetail) {
  if (!variant) return product.is_in_stock;
  if (typeof variant.stock_quantity === "number") return variant.stock_quantity > 0;
  return product.is_in_stock;
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
          {Icon && <Icon size={18} className="text-foreground/40" />}
          <h2 className="text-sm font-bold uppercase tracking-[0.15em]">{title}</h2>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-foreground/40 transition-transform duration-300",
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
          <div className="pb-5 pt-1 text-sm leading-relaxed text-foreground/70">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-3 border border-border/40 p-5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductGallery({
  product,
  layout = "default",
}: {
  product: ProductDetail;
  layout?: "default" | "minimal";
}) {
  const images = React.useMemo(() => {
    const next: Array<{ id: string; image: string; alt: string }> = [];
    const pushImage = (id: string, image: string | null | undefined, alt: string) => {
      if (!image) return;
      if (next.some((item) => item.image === image)) return;
      next.push({ id, image, alt });
    };

    const primaryImage =
      typeof product.primary_image === "string"
        ? product.primary_image
        : (product.primary_image as { image?: string | null } | null)?.image || null;

    pushImage("primary", primaryImage, product.name);
    (product.images || []).forEach((image) => {
      pushImage(image.id, image.image, image.alt_text || product.name);
    });
    return next;
  }, [product]);
  const [active, setActive] = React.useState(0);
  const activeImage = images[active] || images[0] || null;
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [zoomOrigin, setZoomOrigin] = React.useState("center");
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const thumbsRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setActive(0);
    setIsZoomed(false);
    setLightboxOpen(false);
  }, [product.id]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!activeImage) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setZoomOrigin(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  };

  const zoomActive = isZoomed || isHovering;
  const hasMultipleImages = images.length > 1;
  const isMinimal = layout === "minimal";

  const goNext = React.useCallback(() => {
    if (!images.length) return;
    setActive((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = React.useCallback(() => {
    if (!images.length) return;
    setActive((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  React.useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, lightboxOpen]);

  const scrollThumbs = (direction: "up" | "down") => {
    if (!thumbsRef.current) return;
    const delta = direction === "up" ? -120 : 120;
    thumbsRef.current.scrollBy({ top: delta, behavior: "smooth" });
  };

  return (
    <div className={cn(isMinimal ? "grid gap-6 lg:grid-cols-[96px_1fr]" : "space-y-4")}>
      {isMinimal ? (
        <div className="hidden lg:flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => scrollThumbs("up")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/85 text-foreground/50 transition hover:border-primary hover:text-primary"
            aria-label="Scroll thumbnails up"
          >
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          </button>
          <div
            ref={thumbsRef}
            className="flex max-h-[500px] flex-col gap-3 overflow-y-auto pr-1 scrollbar-none"
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "relative aspect-square w-20 flex-shrink-0 overflow-hidden border-2 transition-all duration-300",
                  index === active ? "border-primary shadow-md" : "border-transparent hover:border-primary/40"
                )}
                aria-label={`Show image ${index + 1}`}
              >
                <Image
                  src={image.image}
                  alt={image.alt}
                  fill
                  sizes="96px"
                  className="object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollThumbs("down")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/85 text-foreground/50 transition hover:border-primary hover:text-primary"
            aria-label="Scroll thumbnails down"
          >
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="relative group">
        <div
          className={cn(
            "relative aspect-[4/5] w-full overflow-hidden bg-muted transition-all duration-500",
            isMinimal ? "" : "lg:mx-auto lg:max-w-[500px]"
          )}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            if (!isZoomed) setZoomOrigin("center");
          }}
          onMouseMove={handleMouseMove}
          onClick={() => setIsZoomed((prev) => !prev)}
        >
          {activeImage ? (
            <Image
              src={activeImage.image}
              alt={activeImage.alt}
              fill
              priority={active === 0}
              sizes="(max-width: 768px) 100vw, 800px"
              className={cn(
                "h-full w-full object-cover transition-transform duration-700 ease-out",
                zoomActive ? "scale-110" : "scale-100",
                isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              )}
              style={{ transformOrigin: zoomOrigin }}
            />
          ) : null}
          
          {/* Gallery Overlay Controls */}
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="pointer-events-auto rounded-full bg-background/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/70 shadow-sm border border-border/40">
                {images.length ? `${active + 1} / ${images.length}` : "1 / 1"}
              </div>
              <button 
                onClick={() => setLightboxOpen(true)}
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-md text-foreground/60 shadow-sm border border-border/40 hover:text-primary transition-colors"
                aria-label="Zoom in"
              >
                <ChevronUp className="rotate-45" size={18} />
              </button>
          </div>
        </div>

        {/* Mobile Thumbnails */}
        {hasMultipleImages && (
          <div className="flex gap-2.5 overflow-x-auto mt-4 px-1 py-1 lg:hidden scrollbar-none">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "relative aspect-square w-16 flex-shrink-0 overflow-hidden border-2 transition-all",
                  index === active ? "border-primary" : "border-transparent"
                )}
              >
                <Image
                  src={image.image}
                  alt={image.alt}
                  fill
                  sizes="64px"
                  className="object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        )}

        {lightboxOpen && activeImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/98 backdrop-blur-xl animate-in fade-in duration-300">
            <button
              type="button"
              className="absolute right-6 top-6 rounded-full bg-muted/80 p-3 text-foreground/60 transition hover:text-foreground"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={24} />
            </button>
            <div className="relative max-h-[85vh] max-w-[95vw]">
              <Image
                src={activeImage.image}
                alt={activeImage.alt}
                width={1200}
                height={1500}
                className="max-h-[85vh] object-contain shadow-2xl"
                loading="lazy"
                decoding="async"
              />
              {hasMultipleImages && (
                <>
                  <button onClick={goPrev} className="absolute -left-12 top-1/2 -translate-y-1/2 p-3 text-foreground/40 hover:text-primary transition-colors hidden sm:block">
                    <ChevronLeft size={48} strokeWidth={1} />
                  </button>
                  <button onClick={goNext} className="absolute -right-12 top-1/2 -translate-y-1/2 p-3 text-foreground/40 hover:text-primary transition-colors hidden sm:block">
                    <ChevronRight size={48} strokeWidth={1} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BackInStockForm({
  product,
  variantId,
}: {
  product: ProductDetail;
  variantId?: string | null;
}) {
  const { hasToken } = useAuthContext();
  const { push } = useToast();
  const [email, setEmail] = React.useState("");

  const requestNotification = useMutation({
    mutationFn: async () => {
      return apiFetch(`/catalog/products/${product.slug}/request-back-in-stock/`, {
        method: "POST",
        body: {
          variant_id: variantId || undefined,
          email: hasToken ? undefined : email,
        },
      });
    },
    onSuccess: (response) => {
      const message =
        response && typeof response === "object" && "detail" in response
          ? String((response as { detail?: string }).detail || "")
          : "We will notify you when it is back in stock.";
      push(message, "success");
    },
    onError: () => {
      push("Could not submit back in stock request.", "error");
    },
  });

  return (
    <Card variant="bordered" className="space-y-4 p-5 bg-muted/30 border-dashed border-2">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
          <Info size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest">Get notified</h3>
          <p className="text-xs text-foreground/50">When this item returns</p>
        </div>
      </div>
      
      {!hasToken ? (
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        />
      ) : null}
      <Button
        size="md"
        variant="primary"
        className="w-full h-11 shadow-sm"
        onClick={() => requestNotification.mutate()}
        disabled={requestNotification.isPending || (!hasToken && !email)}
      >
        {requestNotification.isPending ? "Processing..." : "Notify Me"}
      </Button>
    </Card>
  );
}

function ShippingEstimator({
  product,
  quantity,
  unitPrice,
}: {
  product: ProductDetail;
  quantity: number;
  unitPrice: string | number | null | undefined;
}) {
  const { push } = useToast();
  const [country, setCountry] = React.useState("Bangladesh");
  const [state, setState] = React.useState("Dhaka");
  const [postalCode] = React.useState("");
  const [result, setResult] = React.useState<ShippingRateResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const safeQuantity = Math.max(1, Number.isFinite(quantity) ? quantity : 1);
  const unitPriceValue =
    toNumber(unitPrice) ??
    toNumber(product.current_price) ??
    toNumber(product.price) ??
    0;
  const subtotal = unitPriceValue * safeQuantity;

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
          item_count: safeQuantity,
          product_ids: [product.id],
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
    <Card variant="bordered" className="p-6 bg-muted/10 space-y-5">
      <div className="flex items-center gap-3">
        <Truck size={20} className="text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80">
          Delivery Estimator
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
         <input
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          placeholder="Country"
        />
        <input
          value={state}
          onChange={(event) => setState(event.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          placeholder="State"
        />
        <Button
          size="md"
          variant="secondary"
          onClick={handleEstimate}
          disabled={loading}
          className="h-11 shadow-sm"
        >
          {loading ? "Calculating..." : "Get Rates"}
        </Button>
      </div>

      {orderedMethods.length > 0 && (
        <div className="space-y-3 pt-2 animate-in slide-in-from-top-4 duration-500">
          {orderedMethods.map((method) => (
            <div
              key={method.code || method.name}
              className="group relative flex items-center justify-between p-4 rounded-xl bg-background border border-border/60 hover:border-primary/30 transition-all shadow-sm"
            >
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">{method.name}</p>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-foreground/40 font-bold">
                   {resolveDeliveryLabel(method)}
                   {method.is_express && (
                      <span className="text-accent">• Express</span>
                   )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{method.rate_display || method.rate}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ProductReviews({ product, reviewStatsQuery: sharedReviewStatsQuery }: { product: ProductDetail; reviewStatsQuery: ReturnType<typeof useQuery<ReviewStatistics | undefined, Error>> }) {
  const { hasToken } = useAuthContext();
  const { push } = useToast();
  const [page, setPage] = React.useState(1);
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");

  const reviewsQuery = useQuery({
    queryKey: ["product", product.id, "reviews", page],
    queryFn: async () => {
      const response = await apiFetch<Review[]>(
        `/reviews/product/${product.id}/`,
        { params: { page } }
      );
      return {
        reviews: response.data || [],
        pagination: response.meta?.pagination || null,
      };
    },
  });

  const addReview = useMutation({
    mutationFn: async () => {
      return apiFetch(`/reviews/`, {
        method: "POST",
        body: { product_id: product.id, rating, title, body },
      });
    },
    onSuccess: () => {
      push("Review submitted. Pending approval.", "success");
      setTitle("");
      setBody("");
      sharedReviewStatsQuery.refetch();
      reviewsQuery.refetch();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.message) {
        push(error.message, "error");
        return;
      }
      push("Could not submit review.", "error");
    },
  });

  const summary = sharedReviewStatsQuery.data;
  const isInitialLoading = sharedReviewStatsQuery.isLoading || (reviewsQuery.isLoading && page === 1);
  const totalPages = Math.max(1, reviewsQuery.data?.pagination?.total_pages || 1);
  
  const ratingRows = [5, 4, 3, 2, 1].map((star) => {
    const count = Number(summary?.distribution?.[String(star)] || 0);
    const total = summary?.total_count || 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { star, count, percent };
  });

  return (
    <Card variant="bordered" className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row gap-10 md:items-center">
        <div className="space-y-3">
          <h3 className="text-2xl font-bold tracking-tight">Customer Reviews</h3>
          {summary ? (
            <div className="flex items-center gap-4">
              <span className="text-5xl font-black text-foreground">{summary.average_rating}</span>
              <div className="space-y-1">
                <RatingStars rating={summary.average_rating} showCount={false} size="lg" />
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                  {summary.total_count} Verified Reviews
                </p>
              </div>
            </div>
          ) : isInitialLoading ? (
            <div className="h-20 w-48 animate-pulse rounded bg-muted" />
          ) : null}
        </div>

        <div className="flex-1 max-w-md space-y-2.5">
          {ratingRows.map((row) => (
            <div key={row.star} className="flex items-center gap-4 text-xs font-bold uppercase tracking-tighter">
              <span className="w-12 text-foreground/40">{row.star} Star</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: isInitialLoading ? "0%" : `${row.percent}%` }}
                />
              </div>
              <span className="w-8 text-right text-foreground/60">{row.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-10 border-t border-border/60">
        {isInitialLoading ? (
          <ReviewSkeleton />
        ) : reviewsQuery.data?.reviews?.length ? (
          <div className="space-y-8">
            {reviewsQuery.data.reviews.map((review) => (
              <article key={review.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center font-bold text-primary text-xs uppercase">
                      {(review.user_name || "C")[0]}
                    </div>
                    <div>
                       <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground/90">{review.user_name || "Customer"}</span>
                        {review.verified_purchase && (
                          <span className="text-[10px] font-black uppercase text-success-600 bg-success-500/5 px-1.5 py-0.5 rounded border border-success-500/20">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{formatDateLabel(review.created_at)}</p>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} showCount={false} size="sm" />
                </div>
                <div className="pl-13 space-y-2">
                  {review.title && <h4 className="font-bold text-sm">{review.title}</h4>}
                  <p className="text-sm leading-relaxed text-foreground/70 max-w-2xl">{review.body}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-3 bg-muted/10 border border-dashed border-border/60">
            <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">No reviews yet</p>
            <p className="text-xs text-foreground/30">Be the first to share your experience with this item.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
           <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-full border border-border"
            disabled={page <= 1}
            onClick={() => {
               setPage(p => Math.max(1, p - 1));
               document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <ChevronLeft size={18} />
          </Button>
          <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-full border border-border"
            disabled={page >= totalPages}
            onClick={() => {
              setPage(p => p + 1);
              document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      )}

      {hasToken && (
        <div className="pt-10 border-t border-border/60 space-y-6">
           <div className="space-y-1">
              <h4 className="text-lg font-bold">Write a review</h4>
              <p className="text-xs text-foreground/40">Share your thoughts with other customers</p>
           </div>
           
           <div className="grid gap-6">
              <div className="flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map((v) => (
                   <button
                    key={v}
                    onClick={() => setRating(v)}
                    className={cn(
                      "h-12 w-12 border-2 transition-all flex items-center justify-center font-bold text-sm",
                      rating === v ? "border-primary bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "border-border/60 text-foreground/40 hover:border-primary/40"
                    )}
                   >
                    {v}
                   </button>
                ))}
              </div>

              <div className="space-y-4">
                <input
                  placeholder="Summarize your experience (optional)"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="h-12 w-full max-w-xl rounded-2xl border-2 border-border/60 bg-transparent px-5 text-sm outline-none focus:border-primary/40 transition-colors"
                />
                <textarea
                  placeholder="What did you like or dislike? How was the fit?"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="min-h-[160px] w-full max-w-xl rounded-2xl border-2 border-border/60 bg-transparent p-5 text-sm outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <Button
                variant="primary"
                className="w-full max-w-[200px] h-12 shadow-xl shadow-primary/10"
                onClick={() => addReview.mutate()}
                disabled={addReview.isPending || !body.trim()}
              >
                {addReview.isPending ? "Posting..." : "Submit Review"}
              </Button>
           </div>
        </div>
      )}
    </Card>
  );
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: {
  product: ProductDetail;
  relatedProducts?: ProductListItem[];
}) {
  const variants = React.useMemo<Variant[]>(() => product.variants ?? [], [product.variants]);
  const defaultVariant = React.useMemo(
    () => variants.find((v) => v.is_default) || variants[0] || null,
    [variants]
  );
  
  const [variantId, setVariantId] = React.useState<string | null>(defaultVariant?.id || null);
  const [quantity, setQuantity] = React.useState(1);
  const [selectedOptions, setSelectedOptions] = React.useState<VariantOptionMap>(
    getVariantOptionMap(defaultVariant)
  );

  const sizeAttributeFallback = React.useMemo(
    () =>
      (product.attributes || []).filter((attr) =>
        /(size|waist|inseam|chest|bust|hip|length|width|foot)/i.test(
          `${attr.attribute.name} ${attr.attribute.slug || ""}`
        )
      ),
    [product.attributes]
  );
  
  const hasSizeChartContent = Boolean(product.size_charts?.length || sizeAttributeFallback.length);

  const reviewStatsQuery = useQuery({
    queryKey: ["product", product.id, "review-stats"],
    queryFn: async () => {
      const response = await apiFetch<ReviewStatistics>(`/reviews/product/${product.id}/statistics/`);
      return response.data;
    },
  });

  const variantOptionMapById = React.useMemo(() => {
    const map = new Map<string, VariantOptionMap>();
    variants.forEach((v) => map.set(v.id, getVariantOptionMap(v)));
    return map;
  }, [variants]);

  const optionGroups = React.useMemo(() => {
    const groupMap = new Map<string, { slug: string; name: string; values: string[]; isColor: boolean }>();
    variants.forEach((v) => {
      (v.option_values || []).forEach((ov) => {
        const slug = ov.option?.slug || ov.option?.name || "";
        if (!slug) return;
        const existing = groupMap.get(slug) || {
          slug,
          name: ov.option?.name || slug,
          values: [],
          isColor: /color|colour|shade|tone/i.test(ov.option?.name || slug),
        };
        if (!existing.values.includes(ov.value)) existing.values.push(ov.value);
        groupMap.set(slug, existing);
      });
    });
    return Array.from(groupMap.values());
  }, [variants]);

  const selectedVariant = React.useMemo(
    () => variants.find((v) => v.id === variantId) || defaultVariant || null,
    [defaultVariant, variantId, variants]
  );
  
  const inStock = getVariantInStock(selectedVariant, product);
  const stockQty = typeof selectedVariant?.stock_quantity === "number" ? selectedVariant.stock_quantity : product.available_stock;
  const isLowStock = Boolean(product.is_low_stock) || (typeof stockQty === 'number' && stockQty > 0 && stockQty <= 5);

  React.useEffect(() => {
    setVariantId(defaultVariant?.id || null);
    setSelectedOptions(getVariantOptionMap(defaultVariant));
    setQuantity(1);
  }, [defaultVariant, product.id]);

  const handleOptionSelect = (groupSlug: string, value: string) => {
    const nextSelection = { ...selectedOptions, [groupSlug]: value };
    setSelectedOptions(nextSelection);
    
    // Find matching variant
    const nextVariant = variants.find(v => {
      const vMap = variantOptionMapById.get(v.id) || {};
      return Object.entries(nextSelection).every(([s, val]) => vMap[s] === val);
    });
    
    if (nextVariant) setVariantId(nextVariant.id);
  };

  React.useEffect(() => {
    const image = typeof product.primary_image === "string" ? product.primary_image : (product.primary_image as unknown as { image?: string | null })?.image;
    addRecentlyViewed({
      id: product.id,
      slug: product.slug,
      name: product.name,
      primary_image: image || product.images?.[0]?.image,
      current_price: product.current_price,
      currency: product.currency,
      average_rating: product.average_rating,
    });
  }, [product]);

  const unitPrice = selectedVariant?.current_price || selectedVariant?.price || product.current_price || product.price || "0";
  const stockLabel = !inStock ? "Currently Sold Out" : isLowStock ? `Only ${stockQty} left!` : "Ready to Ship";
  
  const categoryTrail = buildProductCategoryTrail(product);
  const breadcrumbLinks = [
    { label: "home", href: "/" },
    ...categoryTrail.map(crumb => ({ label: crumb.name.toLowerCase(), href: buildCategoryPath(crumb.slugPath) })),
    { label: product.name.toLowerCase(), href: buildProductPath(product) },
  ];

  return (
    <div className="space-y-12 pb-24">
      <nav className="flex items-center gap-2 text-[10px] font-normal text-foreground/40">
        {breadcrumbLinks.map((crumb, index) => (
          <React.Fragment key={crumb.label}>
            {index > 0 && <span className="text-[8px] opacity-60">&gt;</span>}
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start">
        <ProductGallery product={product} layout="minimal" />

        <div className="space-y-8 lg:sticky lg:top-[var(--header-offset)]">
          <div className="space-y-3">
             <div className="flex items-center gap-3">
                {product.primary_category && (
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-2 py-1 rounded-md">
                      {product.primary_category.name}
                   </span>
                )}
                {isLowStock && inStock && (
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-700 bg-accent/10 px-2 py-1 rounded-md animate-pulse">
                    Limited Stock
                  </span>
                )}
             </div>
             <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground/90">
               {product.name}
             </h1>
             <div className="flex items-center gap-4">
                <RatingStars rating={product.average_rating || 0} size="sm" />
                <a href="#reviews" className="text-[11px] font-bold uppercase tracking-widest text-foreground/30 hover:text-primary underline-offset-4 hover:underline transition-all">
                  {reviewStatsQuery.data?.total_count || 0} Reviews
                </a>
             </div>
          </div>

          <div className="space-y-1">
             <ProductPrice
                price={product.price}
                salePrice={product.sale_price}
                currentPrice={selectedVariant?.current_price || product.current_price}
                currency={product.currency}
                priceClassName="text-3xl font-black tracking-tight"
                salePriceClassName="text-lg text-foreground/30 line-through font-medium"
              />
              <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Prices include all taxes</p>
          </div>

          <div className="space-y-6 pt-2">
            {optionGroups.map((group) => (
              <div key={group.slug} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/40">
                    Select {group.name}
                  </p>
                  {group.slug.includes('size') && (
                     <button onClick={() => document.getElementById('size-chart')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-bold uppercase tracking-widest text-primary underline underline-offset-4">
                        Size Guide
                     </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {group.values.map((value) => {
                    const selected = selectedOptions[group.slug] === value;
                    const swatchColor = group.isColor ? getColorSwatch(value) : null;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleOptionSelect(group.slug, value)}
                        className={cn(
                          "relative flex h-11 min-w-[3rem] items-center justify-center gap-2 border-2 px-4 transition-all duration-300",
                          selected
                            ? "border-primary bg-primary/5 text-primary scale-105 shadow-sm"
                            : "border-border/60 text-foreground/60 hover:border-primary/30"
                        )}
                      >
                        {swatchColor && (
                          <span className="h-4 w-4 rounded-full border border-border shadow-inner" style={{ backgroundColor: swatchColor }} />
                        )}
                        <span className="text-xs font-bold uppercase tracking-widest">{value}</span>
                        {selected && (
                           <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background">
                              <ChevronDown size={10} className="rotate-45" />
                           </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-4">
             <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
                <div className={cn("h-2 w-2 rounded-full", inStock ? "bg-success-500 animate-pulse" : "bg-destructive")} />
                <span className={cn(inStock ? "text-success-700" : "text-destructive")}>{stockLabel}</span>
             </div>
             
             <AddToCartButton
                productId={product.id}
                variantId={variantId}
                quantity={quantity}
                size="lg"
                variant="primary"
                className="w-full h-14 text-base font-bold shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
                disabled={!inStock}
                label={inStock ? "Add to Shopping Bag" : "Currently Unavailable"}
              />
          </div>

          {!inStock && <BackInStockForm product={product} variantId={variantId} />}

          <div className="pt-6 border-t border-border/60">
            <CollapsibleSection id="description" title="The Detail" icon={Info} defaultExpanded>
               <div className="space-y-4">
                  <p className="text-sm leading-relaxed">{product.description || product.short_description}</p>
                  {(product.attributes?.length ?? 0) > 0 && (
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                        {product.attributes?.map(attr => (
                           <div key={attr.id}>
                              <p className="text-[10px] font-black uppercase text-foreground/30 tracking-widest mb-0.5">{attr.attribute.name}</p>
                              <p className="text-xs font-bold text-foreground/70">{attr.value}</p>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </CollapsibleSection>
            
            {hasSizeChartContent && (
               <CollapsibleSection id="size-chart" title="Size & Fit" icon={ChevronUp}>
                  <div className="space-y-4">
                     {product.size_charts?.map(link => (
                        <div key={link.size_chart.id} className="space-y-3">
                           <p className="font-bold text-foreground/80">{link.size_chart.name} ({link.size_chart.unit})</p>
                           <div className="overflow-x-auto border border-border/60">
                              <table className="w-full text-xs text-left">
                                 <thead className="bg-muted/50 border-b border-border/60">
                                    <tr>{link.size_chart.columns?.map(c => <th key={c} className="p-3 font-black uppercase tracking-widest">{c}</th>)}</tr>
                                 </thead>
                                 <tbody>
                                    {link.size_chart.rows?.map((r, i) => (
                                       <tr key={i} className="border-b border-border/40 last:border-0">{r.map((cell, ci) => <td key={cell+ci} className="p-3 font-medium">{cell}</td>)}</tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     ))}
                  </div>
               </CollapsibleSection>
            )}

            <CollapsibleSection id="shipping" title="Shipping & Returns" icon={RefreshCw}>
               <div className="space-y-4">
                  <div className="flex gap-3">
                     <Truck size={18} className="text-primary shrink-0" />
                     <p className="text-sm">Free standard delivery on orders over BDT 5,000. Express options available at checkout.</p>
                  </div>
                  <div className="flex gap-3">
                     <RefreshCw size={18} className="text-primary shrink-0" />
                     <p className="text-sm">Enjoy free returns within 7 days. Ensure tags are attached and items are in original condition.</p>
                  </div>
               </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>

      <ShippingEstimator product={product} quantity={quantity} unitPrice={unitPrice} />

      <RecentlyViewedSection excludeProductId={product.id} excludeProductSlug={product.slug} />

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="space-y-8 pt-12 border-t border-border/60">
          <h2 className="text-xl font-bold tracking-tight uppercase tracking-[0.2em] text-foreground/30 text-center">You May Also Like</h2>
          <ProductGrid products={relatedProducts} cardStyle="minimal" />
        </section>
      )}

      <section id="reviews" className="pt-12 border-t border-border/60">
        <ProductReviews product={product} reviewStatsQuery={reviewStatsQuery} />
      </section>
    </div>
  );
}
