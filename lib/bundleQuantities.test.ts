import { describe, expect, it } from "vitest";
import {
  getBundleItemCount,
  getBundleShippingItemCount,
} from "@/lib/bundleQuantities";

describe("bundle quantity helpers", () => {
  it("counts physical component units rather than distinct component lines", () => {
    const bundle = {
      item_count: 2,
      items: [
        { id: "first", product: {} as never, quantity: 3 },
        { id: "second", product: {} as never, quantity: 2 },
      ],
    };

    expect(getBundleItemCount(bundle)).toBe(5);
    expect(getBundleShippingItemCount(bundle, 2)).toBe(10);
  });

  it("uses the API count when component lines are not available", () => {
    expect(getBundleItemCount({ item_count: 4 })).toBe(4);
    expect(getBundleShippingItemCount({ item_count: 4 }, 3)).toBe(12);
  });
});
