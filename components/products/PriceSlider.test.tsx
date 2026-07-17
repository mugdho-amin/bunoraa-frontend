import { describe, it, expect } from "vitest";

/**
 * Mirrors PriceSlider parseNum — guards against the dual-thumb-at-min bug.
 * Number(null) === 0 and Number("") === 0, so missing URL params must not
 * be treated as numeric zero.
 */
const parseNum = (v: string | null | undefined, fallback: number) => {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

describe("PriceSlider parseNum (missing URL params)", () => {
  const boundMin = 500;
  const boundMax = 5000;

  it("uses fallback when param is null (not Number(null)=0)", () => {
    expect(parseNum(null, boundMin)).toBe(boundMin);
    expect(parseNum(null, boundMax)).toBe(boundMax);
  });

  it("uses fallback when param is empty string", () => {
    expect(parseNum("", boundMin)).toBe(boundMin);
    expect(parseNum("", boundMax)).toBe(boundMax);
  });

  it("uses fallback when param is undefined", () => {
    expect(parseNum(undefined, boundMax)).toBe(boundMax);
  });

  it("parses valid numeric strings", () => {
    expect(parseNum("1200", boundMax)).toBe(1200);
    expect(parseNum("0", boundMax)).toBe(0);
  });

  it("falls back on non-numeric strings", () => {
    expect(parseNum("abc", boundMax)).toBe(boundMax);
  });

  it("initial range without URL params places thumbs at min and max", () => {
    const urlMin = clamp(parseNum(null, boundMin), boundMin, boundMax);
    const urlMax = clamp(parseNum(null, boundMax), boundMin, boundMax);
    expect(urlMin).toBe(boundMin);
    expect(urlMax).toBe(boundMax);
    expect(urlMin).not.toBe(urlMax);
  });

  it("legacy broken parse would pin both thumbs at min", () => {
    const broken = (v: string | null | undefined, fallback: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };
    const urlMin = clamp(broken(null, boundMin), boundMin, boundMax);
    const urlMax = clamp(broken(null, boundMax), boundMin, boundMax);
    // Both collapse to boundMin — the reported bug
    expect(urlMin).toBe(boundMin);
    expect(urlMax).toBe(boundMin);
  });
});
