"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type PriceRange = {
  min: number;
  max: number;
  currency_symbol: string;
};

/**
 * Parse a URL search param to a finite number.
 *
 * CRITICAL: Number(null) === 0 and Number("") === 0, so we must reject
 * null/empty before calling Number(). Otherwise missing price_min/price_max
 * both become 0 and both thumbs stick at the catalog minimum.
 */
const parseNum = (v: string | null | undefined, fallback: number) => {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toFinite = (v: unknown, fallback: number) => {
  const n = typeof v === "number" ? v : Number(v);
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
 * - correct parse of missing URL params (never treat null as 0)
 */
export function PriceSlider({ priceRange }: { priceRange: PriceRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Coerce API values (may arrive as strings from some serializers)
  const boundMin = toFinite(priceRange.min, 0);
  const boundMax = toFinite(priceRange.max, boundMin);
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
    pushUrl(minRef.current, maxRef.current);
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
      distMax < distMin ||
      (distMax === distMin && clamped > (minRef.current + maxRef.current) / 2);

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

  // Classic dual-range z-index: when max sits at floor, raise it so it stays reachable.
  // Also raise the active handle so crossed/close thumbs remain draggable.
  // Ref: Medium dual-range setToggleAccessible + CSS-Tricks multi-thumb.
  const maxAtFloor = localMax <= boundMin + step;
  const thumbsClose = maxPct - minPct < 5;
  const minZ =
    activeHandle === "min" ? 40 : maxAtFloor ? 20 : thumbsClose && activeHandle !== "max" ? 35 : 30;
  const maxZ = activeHandle === "max" ? 40 : maxAtFloor ? 35 : 32;

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

  const symbol = priceRange.currency_symbol || "";

  return (
    <div className="price-range space-y-5">
      {/* Live range readout (Blucheez / Shopify facet style) */}
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground tabular-nums">
        <span>
          {symbol}
          {formatDisplay(localMin)}
        </span>
        <span className="text-foreground/25" aria-hidden>
          —
        </span>
        <span>
          {symbol}
          {formatDisplay(localMax)}
        </span>
      </div>

      {/* Dual-thumb track — Blucheez: thin grey rail + dark active span + white ring thumbs */}
      <div
        ref={trackRef}
        className="price-range__track relative h-9 flex items-center select-none touch-none cursor-pointer"
        onPointerDown={onTrackPointerDown}
      >
        {/* Full track */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-foreground/15"
          aria-hidden
        />
        {/* Active segment between thumbs */}
        <div
          className="pointer-events-none absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-foreground"
          style={{
            left: `${minPct}%`,
            width: `${Math.max(0, maxPct - minPct)}%`,
          }}
          aria-hidden
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
          className="range-slider range-slider-min"
          style={{ zIndex: minZ }}
          aria-label="Minimum price"
          aria-valuemin={boundMin}
          aria-valuemax={localMax}
          aria-valuenow={localMin}
          aria-valuetext={`${symbol}${localMin}`}
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
          className="range-slider range-slider-max"
          style={{ zIndex: maxZ }}
          aria-label="Maximum price"
          aria-valuemin={localMin}
          aria-valuemax={boundMax}
          aria-valuenow={localMax}
          aria-valuetext={`${symbol}${localMax}`}
        />
      </div>

      {/* Min / Max number fields — Shopify Dawn facets__price layout */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            htmlFor="price-min-input"
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-0.5"
          >
            From
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
              {symbol}
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
              className="price-range__field w-full h-11 pl-8 pr-3 bg-background border border-foreground/15 rounded-none text-sm font-medium tabular-nums focus:border-foreground/40 focus:ring-0 outline-none no-spin transition-colors"
              aria-label="Minimum price value"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="price-max-input"
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground px-0.5"
          >
            To
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
              {symbol}
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
              className="price-range__field w-full h-11 pl-8 pr-3 bg-background border border-foreground/15 rounded-none text-sm font-medium tabular-nums focus:border-foreground/40 focus:ring-0 outline-none no-spin transition-colors"
              aria-label="Maximum price value"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
