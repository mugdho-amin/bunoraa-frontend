"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type PriceRange = {
  min: number;
  max: number;
  currency_symbol: string;
};

const parseNum = (v: string | null | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

function getStep(range: number) {
  if (range > 10000) return 100;
  if (range > 5000) return 50;
  if (range > 1000) return 10;
  if (range > 100) return 1;
  return 0.5;
}

export function PriceSlider({ priceRange }: { priceRange: PriceRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlMin = parseNum(searchParams.get("price_min"), priceRange.min);
  const urlMax = parseNum(searchParams.get("price_max"), priceRange.max);

  const [localMin, setLocalMin] = React.useState<number | "">(urlMin);
  const [localMax, setLocalMax] = React.useState<number | "">(urlMax);
  const [isDragging, setIsDragging] = React.useState(false);
  const [activeHandle, setActiveHandle] = React.useState<"min" | "max" | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (isDragging) return;
    setLocalMin(urlMin);
    setLocalMax(urlMax);
  }, [urlMin, urlMax, isDragging]);

  const step = getStep(priceRange.max - priceRange.min);
  const rangeSpan = Math.max(1, priceRange.max - priceRange.min);

  const displayMin = localMin === "" ? priceRange.min : localMin;
  const displayMax = localMax === "" ? priceRange.max : localMax;

  const minPct = ((displayMin - priceRange.min) / rangeSpan) * 100;
  const maxPct = ((displayMax - priceRange.min) / rangeSpan) * 100;
  const minOnTop = displayMin > displayMax - rangeSpan * 0.05;

  const pushUrl = React.useCallback(
    (min: number, max: number) => {
      const p = new URLSearchParams(searchParams.toString());
      if (min > priceRange.min) p.set("price_min", String(min));
      else p.delete("price_min");
      if (max < priceRange.max) p.set("price_max", String(max));
      else p.delete("price_max");
      p.delete("page");
      router.push(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, priceRange.min, priceRange.max]
  );

  const schedulePush = React.useCallback(
    (min: number, max: number, immediate = false) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (immediate) {
        pushUrl(min, max);
      } else {
        timeoutRef.current = setTimeout(() => pushUrl(min, max), 400);
      }
    },
    [pushUrl]
  );

  const commitMinMax = React.useCallback(
    (min: number, max: number) => {
      const clampedMin = clamp(min, priceRange.min, max);
      const clampedMax = clamp(max, clampedMin, priceRange.max);
      setLocalMin(clampedMin);
      setLocalMax(clampedMax);
      schedulePush(clampedMin, clampedMax, true);
    },
    [priceRange.min, priceRange.max, schedulePush]
  );

  const hasValidRange = Number.isFinite(priceRange.min) && Number.isFinite(priceRange.max) && priceRange.max > priceRange.min;
  const disabled = !hasValidRange;

  if (!hasValidRange) {
    return (
      <div className="h-24 flex items-center justify-center">
        <div className="h-1 w-full max-w-[200px] bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1">
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-0.5 bg-muted/60" />
        <div
          className="absolute h-0.5 bg-primary"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />

        <input
          type="range"
          min={priceRange.min}
          max={priceRange.max}
          step={step}
          value={displayMin}
          disabled={disabled}
          onMouseDown={() => { setActiveHandle("min"); setIsDragging(true); }}
          onTouchStart={() => { setActiveHandle("min"); setIsDragging(true); }}
          onChange={(e) => {
            const val = Number(e.target.value);
            const clamped = Math.min(val, displayMax);
            setLocalMin(clamped);
            schedulePush(clamped, displayMax);
          }}
          onMouseUp={() => { setIsDragging(false); schedulePush(displayMin, displayMax, true); }}
          onTouchEnd={() => { setIsDragging(false); schedulePush(displayMin, displayMax, true); }}
          onKeyDown={(e) => {
            if (e.key === "PageUp" || e.key === "PageDown") {
              e.preventDefault();
              const target = e.target as HTMLInputElement;
              const delta = e.key === "PageUp" ? step * 10 : -step * 10;
              const newVal = clamp(Number(target.value) + delta, priceRange.min, displayMax);
              target.value = String(newVal);
              target.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }}
          className="range-slider range-slider-min absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: activeHandle === "min" ? 40 : minOnTop ? 35 : 31 }}
          aria-label="Minimum price"
          aria-valuetext={`${priceRange.currency_symbol}${displayMin}`}
        />

        <input
          type="range"
          min={priceRange.min}
          max={priceRange.max}
          step={step}
          value={displayMax}
          disabled={disabled}
          onMouseDown={() => { setActiveHandle("max"); setIsDragging(true); }}
          onTouchStart={() => { setActiveHandle("max"); setIsDragging(true); }}
          onChange={(e) => {
            const val = Number(e.target.value);
            const clamped = Math.max(val, displayMin);
            setLocalMax(clamped);
            schedulePush(displayMin, clamped);
          }}
          onMouseUp={() => { setIsDragging(false); schedulePush(displayMin, displayMax, true); }}
          onTouchEnd={() => { setIsDragging(false); schedulePush(displayMin, displayMax, true); }}
          onKeyDown={(e) => {
            if (e.key === "PageUp" || e.key === "PageDown") {
              e.preventDefault();
              const target = e.target as HTMLInputElement;
              const delta = e.key === "PageUp" ? step * 10 : -step * 10;
              const newVal = clamp(Number(target.value) + delta, displayMin, priceRange.max);
              target.value = String(newVal);
              target.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }}
          className="range-slider range-slider-max absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: activeHandle === "max" ? 40 : 32 }}
          aria-label="Maximum price"
          aria-valuetext={`${priceRange.currency_symbol}${displayMax}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="price-min-input" className="text-[9px] font-black uppercase tracking-widest text-foreground/40 px-1">
            Min
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/30">
              {priceRange.currency_symbol}
            </span>
            <input
              id="price-min-input"
              type="number"
              value={localMin}
              placeholder={String(priceRange.min)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") { setLocalMin(""); return; }
                const num = Number(raw);
                if (!Number.isFinite(num)) return;
                setLocalMin(clamp(num, priceRange.min, Number(localMax) || priceRange.max));
              }}
              onBlur={() => {
                const min = localMin === "" ? priceRange.min : Number(localMin);
                const max = localMax === "" ? priceRange.max : Number(localMax);
                commitMinMax(min, max);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="w-full h-11 pl-8 pr-3 bg-muted/10 border border-border/40 rounded-xl text-sm font-black focus:ring-1 focus:ring-primary/20 outline-none no-spin transition-all"
              aria-label="Minimum price value"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="price-max-input" className="text-[9px] font-black uppercase tracking-widest text-foreground/40 px-1">
            Max
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/30">
              {priceRange.currency_symbol}
            </span>
            <input
              id="price-max-input"
              type="number"
              value={localMax}
              placeholder={String(priceRange.max)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") { setLocalMax(""); return; }
                const num = Number(raw);
                if (!Number.isFinite(num)) return;
                setLocalMax(clamp(num, Number(localMin) || priceRange.min, priceRange.max));
              }}
              onBlur={() => {
                const min = localMin === "" ? priceRange.min : Number(localMin);
                const max = localMax === "" ? priceRange.max : Number(localMax);
                commitMinMax(min, max);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="w-full h-11 pl-8 pr-3 bg-muted/10 border border-border/40 rounded-xl text-sm font-black focus:ring-1 focus:ring-primary/20 outline-none no-spin transition-all"
              aria-label="Maximum price value"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
