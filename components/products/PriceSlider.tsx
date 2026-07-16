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

function roundToStep(value: number, step: number, min: number) {
  if (step <= 0) return value;
  const rounded = Math.round((value - min) / step) * step + min;
  // Avoid floating-point noise (e.g. 0.30000000004)
  const decimals = String(step).includes(".") ? String(step).split(".")[1].length : 0;
  return Number(rounded.toFixed(decimals));
}

/**
 * Dual price-range slider (Blucheez / Shopify-style).
 *
 * Stacks two native <input type="range"> elements with:
 * - pointer-events only on thumbs (CSS)
 * - dynamic z-index so the active / closest thumb is grabable
 * - local-only updates while dragging; URL commit on release
 * - refs so mouseup never pushes stale min/max
 */
export function PriceSlider({ priceRange }: { priceRange: PriceRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const boundMin = priceRange.min;
  const boundMax = priceRange.max;
  const hasValidRange =
    Number.isFinite(boundMin) && Number.isFinite(boundMax) && boundMax > boundMin;

  const urlMin = clamp(parseNum(searchParams.get("price_min"), boundMin), boundMin, boundMax);
  const urlMax = clamp(parseNum(searchParams.get("price_max"), boundMax), boundMin, boundMax);
  // Ensure URL min never exceeds URL max
  const safeUrlMin = Math.min(urlMin, urlMax);
  const safeUrlMax = Math.max(urlMin, urlMax);

  const [localMin, setLocalMin] = React.useState(safeUrlMin);
  const [localMax, setLocalMax] = React.useState(safeUrlMax);
  const [isDragging, setIsDragging] = React.useState(false);
  const [activeHandle, setActiveHandle] = React.useState<"min" | "max" | null>(null);

  // Always hold the latest values for pointer-up / commit (avoids stale closures)
  const minRef = React.useRef(safeUrlMin);
  const maxRef = React.useRef(safeUrlMax);
  const draggingRef = React.useRef(false);
  const lastPushedRef = React.useRef(`${safeUrlMin}|${safeUrlMax}`);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  const step = getStep(boundMax - boundMin);
  const rangeSpan = Math.max(step, boundMax - boundMin);

  // Keep refs aligned with state
  minRef.current = localMin;
  maxRef.current = localMax;

  // When absolute catalog bounds change (category/search switch), adopt URL range.
  React.useEffect(() => {
    minRef.current = safeUrlMin;
    maxRef.current = safeUrlMax;
    setLocalMin(safeUrlMin);
    setLocalMax(safeUrlMax);
    lastPushedRef.current = `${safeUrlMin}|${safeUrlMax}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when absolute bounds change
  }, [boundMin, boundMax]);

  // Sync from URL when not dragging. Never clobber local values while our own
  // push is still in-flight (URL lags behind lastPushedRef).
  React.useEffect(() => {
    if (draggingRef.current || isDragging) return;
    const urlKey = `${safeUrlMin}|${safeUrlMax}`;
    if (urlKey === lastPushedRef.current) {
      // URL caught up with what we pushed (or initial match)
      return;
    }
    const localKey = `${minRef.current}|${maxRef.current}`;
    if (localKey === lastPushedRef.current) {
      // We pushed newer values; wait for the router to reflect them
      return;
    }
    // External navigation / back-forward — adopt URL values
    setLocalMin(safeUrlMin);
    setLocalMax(safeUrlMax);
    minRef.current = safeUrlMin;
    maxRef.current = safeUrlMax;
    lastPushedRef.current = urlKey;
  }, [safeUrlMin, safeUrlMax, isDragging]);

  const pushUrl = React.useCallback(
    (min: number, max: number) => {
      const nextMin = clamp(min, boundMin, max);
      const nextMax = clamp(max, nextMin, boundMax);
      const key = `${nextMin}|${nextMax}`;
      if (key === lastPushedRef.current) return;
      lastPushedRef.current = key;

      const p = new URLSearchParams(searchParams.toString());
      if (nextMin > boundMin) p.set("price_min", String(nextMin));
      else p.delete("price_min");
      if (nextMax < boundMax) p.set("price_max", String(nextMax));
      else p.delete("price_max");
      p.delete("page");

      const qs = p.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, boundMin, boundMax]
  );

  const beginDrag = (handle: "min" | "max") => {
    draggingRef.current = true;
    setIsDragging(true);
    setActiveHandle(handle);
  };

  const endDrag = React.useCallback(() => {
    if (!draggingRef.current && !isDragging) return;
    draggingRef.current = false;
    setIsDragging(false);
    setActiveHandle(null);
    const min = minRef.current;
    const max = maxRef.current;
    pushUrl(min, max);
  }, [isDragging, pushUrl]);

  // Global pointerup/touchend so release outside the thumb still commits
  React.useEffect(() => {
    if (!isDragging) return;
    const onUp = () => endDrag();
    window.addEventListener("pointerup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, endDrag]);

  const onMinChange = (raw: number) => {
    const val = clamp(raw, boundMin, maxRef.current);
    minRef.current = val;
    setLocalMin(val);
  };

  const onMaxChange = (raw: number) => {
    const val = clamp(raw, minRef.current, boundMax);
    maxRef.current = val;
    setLocalMax(val);
  };

  /** Click/tap on track moves the nearer thumb (Shopify-like). */
  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore if the event already targeted a thumb (range input)
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT") return;

    const track = trackRef.current;
    if (!track || !hasValidRange) return;

    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;

    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const value = roundToStep(boundMin + ratio * rangeSpan, step, boundMin);
    const clamped = clamp(value, boundMin, boundMax);

    const distMin = Math.abs(clamped - minRef.current);
    const distMax = Math.abs(clamped - maxRef.current);
    const preferMax =
      distMax < distMin || (distMax === distMin && clamped > (minRef.current + maxRef.current) / 2);

    if (preferMax) {
      beginDrag("max");
      onMaxChange(Math.max(clamped, minRef.current));
    } else {
      beginDrag("min");
      onMinChange(Math.min(clamped, maxRef.current));
    }
  };

  const minPct = ((localMin - boundMin) / rangeSpan) * 100;
  const maxPct = ((localMax - boundMin) / rangeSpan) * 100;

  // Raise z-index of the active thumb; when max sits at the floor, max must sit above min
  // so it remains reachable (classic dual-range gotcha).
  const maxAtFloor = localMax <= boundMin + step;
  const thumbsClose = maxPct - minPct < 5;
  const minZ =
    activeHandle === "min" ? 40 : maxAtFloor ? 20 : thumbsClose && activeHandle !== "max" ? 35 : 30;
  const maxZ =
    activeHandle === "max" ? 40 : maxAtFloor ? 35 : 32;

  const formatDisplay = (n: number) => {
    if (!Number.isFinite(n)) return "";
    return Number.isInteger(n) ? String(n) : String(n);
  };

  const commitInputs = () => {
    const min = clamp(minRef.current, boundMin, maxRef.current);
    const max = clamp(maxRef.current, min, boundMax);
    minRef.current = min;
    maxRef.current = max;
    setLocalMin(min);
    setLocalMax(max);
    lastPushedRef.current = ""; // force push even if same as last visual
    pushUrl(min, max);
  };

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
    <div className="space-y-5 px-0.5">
      {/* Live range readout (Blucheez / Shopify facet style) */}
      <div className="flex items-center justify-between text-xs font-semibold text-foreground/70">
        <span>
          {priceRange.currency_symbol}
          {formatDisplay(localMin)}
        </span>
        <span className="text-foreground/30">—</span>
        <span>
          {priceRange.currency_symbol}
          {formatDisplay(localMax)}
        </span>
      </div>

      {/* Dual-thumb track */}
      <div
        ref={trackRef}
        className="relative h-8 flex items-center select-none touch-none cursor-pointer"
        onPointerDown={onTrackPointerDown}
      >
        {/* Full track */}
        <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-muted/80" />
        {/* Active segment between thumbs */}
        <div
          className="pointer-events-none absolute h-1 rounded-full bg-foreground"
          style={{
            left: `${minPct}%`,
            width: `${Math.max(0, maxPct - minPct)}%`,
          }}
        />

        <input
          type="range"
          min={boundMin}
          max={boundMax}
          step={step}
          value={localMin}
          disabled={!hasValidRange}
          onPointerDown={(e) => {
            e.stopPropagation();
            beginDrag("min");
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            beginDrag("min");
          }}
          onChange={(e) => onMinChange(Number(e.target.value))}
          className="range-slider range-slider-min absolute inset-x-0 w-full appearance-none bg-transparent"
          style={{ zIndex: minZ }}
          aria-label="Minimum price"
          aria-valuemin={boundMin}
          aria-valuemax={localMax}
          aria-valuenow={localMin}
          aria-valuetext={`${priceRange.currency_symbol}${localMin}`}
        />

        <input
          type="range"
          min={boundMin}
          max={boundMax}
          step={step}
          value={localMax}
          disabled={!hasValidRange}
          onPointerDown={(e) => {
            e.stopPropagation();
            beginDrag("max");
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            beginDrag("max");
          }}
          onChange={(e) => onMaxChange(Number(e.target.value))}
          className="range-slider range-slider-max absolute inset-x-0 w-full appearance-none bg-transparent"
          style={{ zIndex: maxZ }}
          aria-label="Maximum price"
          aria-valuemin={localMin}
          aria-valuemax={boundMax}
          aria-valuenow={localMax}
          aria-valuetext={`${priceRange.currency_symbol}${localMax}`}
        />
      </div>

      {/* Min / Max number fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="price-min-input"
            className="text-[9px] font-black uppercase tracking-widest text-foreground/40 px-1"
          >
            Min
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/30 pointer-events-none">
              {priceRange.currency_symbol}
            </span>
            <input
              id="price-min-input"
              type="number"
              inputMode="decimal"
              min={boundMin}
              max={localMax}
              step={step}
              value={formatDisplay(localMin)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return;
                const num = Number(raw);
                if (!Number.isFinite(num)) return;
                onMinChange(num);
              }}
              onBlur={commitInputs}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="w-full h-11 pl-8 pr-3 bg-muted/10 border border-border/40 rounded-xl text-sm font-black focus:ring-1 focus:ring-primary/20 outline-none no-spin transition-all"
              aria-label="Minimum price value"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="price-max-input"
            className="text-[9px] font-black uppercase tracking-widest text-foreground/40 px-1"
          >
            Max
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/30 pointer-events-none">
              {priceRange.currency_symbol}
            </span>
            <input
              id="price-max-input"
              type="number"
              inputMode="decimal"
              min={localMin}
              max={boundMax}
              step={step}
              value={formatDisplay(localMax)}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return;
                const num = Number(raw);
                if (!Number.isFinite(num)) return;
                onMaxChange(num);
              }}
              onBlur={commitInputs}
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
