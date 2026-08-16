import type { Bundle, BundleItem } from "@/lib/types";

function normalizedLineQuantity(quantity: BundleItem["quantity"]): number {
  const parsed = Number(quantity);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function normalizedItemCount(itemCount: Bundle["item_count"]): number {
  const parsed = Number(itemCount);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

/** Total physical component units contained in one bundle. */
export function getBundleItemCount(bundle: Pick<Bundle, "items" | "item_count">): number {
  if (bundle.items && bundle.items.length > 0) {
    return bundle.items.reduce((total, line) => total + normalizedLineQuantity(line.quantity), 0);
  }
  return normalizedItemCount(bundle.item_count);
}

/** Physical component units represented by a requested number of bundle kits. */
export function getBundleShippingItemCount(
  bundle: Pick<Bundle, "items" | "item_count">,
  bundleQuantity: number
): number {
  const normalizedBundleQuantity =
    Number.isFinite(bundleQuantity) && bundleQuantity > 0 ? Math.floor(bundleQuantity) : 1;
  return Math.max(1, getBundleItemCount(bundle)) * normalizedBundleQuantity;
}
