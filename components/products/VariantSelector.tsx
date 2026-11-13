"use client";

import * as React from "react";
import type { ProductVariant } from "@/lib/types";
import { getColorSwatch } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type VariantOptionMap = Record<string, string>;

function getVariantOptionMap(variant: ProductVariant | null | undefined): VariantOptionMap {
  const map: VariantOptionMap = {};
  if (!variant?.option_values?.length) return map;
  variant.option_values.forEach((ov) => {
    if (!ov.option?.slug || !ov.value) return;
    map[ov.option.slug] = ov.value;
  });
  return map;
}

function getVariantInStock(variant: ProductVariant | null | undefined) {
  if (!variant) return true;
  if (typeof variant.stock_quantity === "number") return variant.stock_quantity > 0;
  return true;
}

type OptionGroup = {
  slug: string;
  name: string;
  values: string[];
  isColor: boolean;
};

type VariantSelectorProps = {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onChange: (variantId: string | null) => void;
};

export function VariantSelector({ variants, selectedVariantId, onChange }: VariantSelectorProps) {
  const defaultVariant = React.useMemo(
    () =>
      variants.find((v) => v.is_default && getVariantInStock(v)) ||
      variants.find((v) => getVariantInStock(v)) ||
      variants.find((v) => v.is_default) ||
      variants[0] ||
      null,
    [variants]
  );

  const [selectedOptions, setSelectedOptions] = React.useState<VariantOptionMap>(() =>
    getVariantOptionMap(selectedVariantId ? variants.find((v) => v.id === selectedVariantId) || defaultVariant : defaultVariant)
  );

  const variantOptionMapById = React.useMemo(() => {
    const map = new Map<string, VariantOptionMap>();
    variants.forEach((v) => map.set(v.id, getVariantOptionMap(v)));
    return map;
  }, [variants]);

  const optionGroups = React.useMemo(() => {
    const groupMap = new Map<string, OptionGroup>();
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
    () => variants.find((v) => v.id === selectedVariantId) || null,
    [selectedVariantId, variants]
  );

  const inStock = Boolean(selectedVariant && getVariantInStock(selectedVariant));
  const initializedDefault = React.useRef(false);

  React.useEffect(() => {
    if (initializedDefault.current) return;
    if (selectedVariantId) {
      initializedDefault.current = true;
      return;
    }
    if (defaultVariant) {
      onChange(defaultVariant.id);
      setSelectedOptions(getVariantOptionMap(defaultVariant));
      initializedDefault.current = true;
    }
  }, [defaultVariant, onChange, selectedVariantId]);

  const handleOptionSelect = (groupSlug: string, value: string) => {
    const nextSelection: VariantOptionMap = { [groupSlug]: value };
    Object.entries(selectedOptions).forEach(([slug, selectedValue]) => {
      if (slug === groupSlug) return;
      const candidate = { ...nextSelection, [slug]: selectedValue };
      const hasAvailableMatch = variants.some((variant) => {
        if (!getVariantInStock(variant)) return false;
        const optionMap = variantOptionMapById.get(variant.id) || {};
        return optionGroups.every((group) =>
          candidate[group.slug] === undefined || optionMap[group.slug] === candidate[group.slug]
        );
      });
      if (hasAvailableMatch) nextSelection[slug] = selectedValue;
    });
    setSelectedOptions(nextSelection);

    const allOptionsSelected = optionGroups.every((group) => Boolean(nextSelection[group.slug]));
    const nextVariant = allOptionsSelected ? variants.find((v) => {
      if (!getVariantInStock(v)) return false;
      const vMap = variantOptionMapById.get(v.id) || {};
      return optionGroups.every((group) => vMap[group.slug] === nextSelection[group.slug]);
    }) : null;

    onChange(nextVariant?.id || null);
  };

  const isOptionValueAvailable = (groupSlug: string, value: string) => {
    return variants.some((variant) => {
      if (!getVariantInStock(variant)) return false;
      const optionMap = variantOptionMapById.get(variant.id) || {};
      return optionMap[groupSlug] === value;
    });
  };

  if (optionGroups.length === 0) return null;

  return (
    <div className="space-y-4">
      {optionGroups.map((group) => (
        <div key={group.slug} className="space-y-2.5">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground">
            {group.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const selected = selectedOptions[group.slug] === value;
              const available = isOptionValueAvailable(group.slug, value);
              const swatchColor = group.isColor ? getColorSwatch(value) : null;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleOptionSelect(group.slug, value)}
                  disabled={!available}
                  aria-pressed={selected}
                  aria-label={`${group.name}: ${value}${available ? "" : ", unavailable with the current options"}`}
                  className={cn(
                    "relative flex h-10 min-w-[2.75rem] items-center justify-center gap-2 border-2 px-3.5 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40",
                    selected
                      ? "border-foreground bg-foreground text-background scale-105 shadow-sm"
                      : "border-border/60 bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  )}
                >
                  {swatchColor && (
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-border shadow-inner shrink-0"
                      style={{ backgroundColor: swatchColor }}
                    />
                  )}
                  <span className="text-xs font-bold uppercase tracking-widest">{value}</span>
                  {selected && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground text-background border-2 border-background">
                      <ChevronDown size={8} className="rotate-45" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            inStock ? "bg-emerald-500" : "bg-destructive"
          )}
        />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {inStock
            ? selectedVariant
              ? `In Stock`
              : "Select options"
            : "Currently Unavailable"}
        </span>
      </div>
    </div>
  );
}
