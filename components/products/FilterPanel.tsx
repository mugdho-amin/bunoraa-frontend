"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { ProductFilterResponse } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  parseFilters,
  toggleMultiValue,
  updateParamValue,
  getAppliedFilters,
  clearAllFilters,
} from "@/lib/productFilters";
import { cn } from "@/lib/utils";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { useUiMessages } from "@/components/i18n/useUiMessages";
import { getColorSwatch } from "@/lib/colors";
import { PriceSlider } from "@/components/products/PriceSlider";

export type CategoryFacet = {
  id: string;
  name: string;
  slug: string;
  type?: string;
  values?: Array<{ value: string; display_value?: string }>;
  value_counts?: Array<{ value: string; count: number }>;
};

export type CategoryFilterItem = {
  id: string;
  name: string;
  slug: string;
  slug_path?: string | null;
  product_count?: number | null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(true);
  return (
    <section className="space-y-3 py-5 border-b border-border/40 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between font-bold uppercase tracking-widest text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
      >
        <span>{title}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", !isOpen && "-rotate-90 opacity-40")} />
      </button>
      {isOpen && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
          {children}
        </div>
      )}
    </section>
  );
}

export function FilterPanel({
  filters,
  facets,
  categories,
  productCount,
  className,
  currentCategoryPath,
  variant = "default",
}: {
  filters: ProductFilterResponse | null;
  facets?: CategoryFacet[];
  categories?: CategoryFilterItem[];
  productCount?: number;
  className?: string;
  currentCategoryPath?: string;
  variant?: "default" | "minimal";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useUiMessages("filters");

  const current = parseFilters(searchParams);
  const appliedFilters = getAppliedFilters(current);
  const hasAppliedFilters = appliedFilters.length > 0;

  const priceRange = filters?.price_range;
  const hasPriceData = priceRange !== undefined && priceRange !== null;
  const rangeLoading = !hasPriceData || !filters;

  const attributeGroups = React.useMemo(() => {
    const groups: Array<{ name: string; slug: string; values: Array<{ value: string; count?: number }> }> = [];
    if (filters?.attributes) {
      Object.entries(filters.attributes).forEach(([name, info]) => {
        groups.push({
          name,
          slug: info.slug,
          values: info.values
            .map((value) => ({ value }))
            .filter((item) => String(item.value).trim().length > 0),
        });
      });
    }
    if (facets && facets.length) {
      facets.forEach((facet) => {
        const values = facet.value_counts
          ? facet.value_counts.map((item) => ({ value: item.value, count: item.count }))
          : (facet.values || []).map((item) => ({
              value: typeof item === "string" ? item : item.value,
            }));
        const cleaned = values.filter((item) => String(item.value).trim().length > 0);
        groups.push({ name: facet.name, slug: facet.slug, values: cleaned });
      });
    }
    const bySlug: Record<string, { name: string; slug: string; values: Array<{ value: string; count?: number }> }> = {};
    groups.forEach((group) => {
      if (!group.values.length) return;
      if (!bySlug[group.slug]) {
        bySlug[group.slug] = { ...group };
      } else {
        const merged = new Map(bySlug[group.slug].values.map((item) => [item.value, item]));
        group.values.forEach((item) => {
          const existing = merged.get(item.value);
          if (existing) {
            merged.set(item.value, { ...existing, ...item });
          } else {
            merged.set(item.value, item);
          }
        });
        bySlug[group.slug].values = Array.from(merged.values());
      }
    });
    return Object.values(bySlug).filter((group) => group.values.length > 0);
  }, [filters, facets]);

  const getCategoryLink = (category: CategoryFilterItem) => {
    const categoryPath = String(category.slug_path || category.slug || "").trim();
    const targetPath = categoryPath.includes("/")
      ? categoryPath
      : (currentCategoryPath ? `${currentCategoryPath}/${categoryPath}` : categoryPath);
    return `${buildCategoryPath(targetPath)}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  };

  const isMinimal = variant === "minimal";

  if (isMinimal) {
    if (rangeLoading) return null;
    const bucketCount = 4;
    const bucketStep = Math.max(1, Math.ceil(priceRange!.max / bucketCount));
    const priceBuckets = [
      { label: `Under ${priceRange!.currency_symbol}${bucketStep}`, min: null, max: bucketStep },
      { label: `${priceRange!.currency_symbol}${bucketStep} - ${priceRange!.currency_symbol}${bucketStep * 2}`, min: bucketStep, max: bucketStep * 2 },
      { label: `${priceRange!.currency_symbol}${bucketStep * 2}+`, min: bucketStep * 2, max: null },
    ];

    return (
      <div className={cn("space-y-8 text-[13px] text-foreground/80", className)}>
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Price Range</h3>
          <ul className="space-y-2">
            {priceBuckets.map((bucket) => {
              const isActive = String(current.priceMin || "") === String(bucket.min || "") && String(current.priceMax || "") === String(bucket.max || "");
              return (
                <li key={bucket.label}>
                  <button
                    type="button"
                    className={cn("text-left transition-colors", isActive ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground")}
                    onClick={() => {
                      const params = updateParamValue(searchParams, "price_min", bucket.min === null ? null : String(bucket.min));
                      const next = updateParamValue(params, "price_max", bucket.max === null ? null : String(bucket.max));
                      router.push(`${pathname}?${next.toString()}`, { scroll: false });
                    }}
                  >
                    {bucket.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between py-2 mb-4 border-b border-border/20">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
          {typeof productCount === "number"
            ? t("product_count", "{count} products", { count: productCount })
            : t("filters", "Filters")}
        </span>
        {hasAppliedFilters ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-transparent hover:text-primary/70"
            onClick={() => {
              const params = clearAllFilters(searchParams);
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            {t("clear_all", "Reset")}
          </Button>
        ) : null}
      </div>

      {(categories || []).length > 0 && (
        <Section title={t("subcategories", "Categories")}>
          <div className="flex flex-wrap gap-2">
            {categories!.filter(c => c.name && (c.product_count ?? 1) > 0).map((category) => (
              <Link
                key={category.id}
                className="inline-flex min-h-10 items-center rounded-xl border border-border/50 px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground bg-card/20"
                href={getCategoryLink(category)}
              >
                {category.name}
                {typeof category.product_count === "number" && (
                  <span className="ml-1.5 opacity-40">({category.product_count})</span>
                )}
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title={t("price_range", "Price range")}>
        {rangeLoading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="h-1 w-full max-w-[200px] bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-primary rounded-full animate-pulse" />
            </div>
          </div>
        ) : (
          <PriceSlider priceRange={priceRange!} />
        )}
      </Section>

      {attributeGroups.map((group) => {
        const isColor = /color|colour|shade|tone/i.test(group.name || group.slug);
        const currentValues = current.attrs[group.slug] || [];
        return (
          <Section key={group.slug} title={group.name}>
            <div className="flex flex-wrap gap-2.5">
              {group.values.map((item) => {
                const isSelected = currentValues.includes(item.value);
                const swatchColor = isColor ? getColorSwatch(item.value) : null;
                return (
                  <button
                    key={item.value}
                    type="button"
                    className={cn(
                      "inline-flex min-h-10 items-center gap-2.5 rounded-2xl border px-4 py-2 text-xs font-bold transition-all duration-300",
                      isSelected
                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-[1.03]"
                        : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30"
                    )}
                    onClick={() => {
                      const params = toggleMultiValue(searchParams, `attr_${group.slug}`, item.value);
                      router.push(`${pathname}?${params.toString()}`, { scroll: false });
                    }}
                  >
                    {swatchColor && (
                      <span className="h-4 w-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: swatchColor }} />
                    )}
                    <span className="uppercase tracking-widest">{item.value}</span>
                    {typeof item.count === "number" && (
                      <span className={cn("ml-0.5 opacity-40 font-medium", isSelected && "text-white/60")}>{item.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>
        );
      })}

      <Section title={t("availability", "Options")}>
        <div className="space-y-1.5">
          {[
            { key: "in_stock", label: t("in_stock_only", "In stock only"), checked: current.inStock },
            { key: "on_sale", label: t("on_sale", "On sale"), checked: current.onSale, hide: !filters?.has_on_sale },
            { key: "new_arrivals", label: t("new_arrivals", "New arrivals"), checked: current.newArrivals },
          ].filter(opt => !opt.hide).map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                const params = updateParamValue(searchParams, opt.key, opt.checked ? null : "true");
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
              }}
              className="flex w-full items-center gap-3 py-2 group"
            >
              <div className={cn(
                "h-5 w-5 rounded-lg border-2 transition-all flex items-center justify-center",
                opt.checked ? "border-primary bg-primary" : "border-border group-hover:border-foreground/30"
              )}>
                {opt.checked && <div className="h-2 w-2 rounded-sm bg-white" />}
              </div>
              <span className={cn("text-xs font-bold uppercase tracking-widest transition-colors", opt.checked ? "text-foreground" : "text-muted-foreground")}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={t("rating", "Customer Rating")}>
        <div className="grid grid-cols-1 gap-1">
          {[4, 3, 2].map((rating) => (
            <button
              key={rating}
              onClick={() => {
                const params = updateParamValue(searchParams, "min_rating", String(rating));
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
              }}
              className="flex items-center gap-3 py-2 group"
            >
              <div className={cn(
                "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center",
                current.minRating === String(rating) ? "border-primary bg-primary" : "border-border group-hover:border-foreground/30"
              )}>
                {current.minRating === String(rating) && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">{rating}+</span>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={cn("h-3 w-3", i < rating ? "fill-current" : "fill-muted opacity-30")} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
