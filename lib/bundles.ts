import { cache } from "react";
import { apiFetch } from "@/lib/api";
import type { Bundle, ProductListItem } from "@/lib/types";
import { asArray } from "@/lib/array";
import { logger } from "@/lib/logger";

export const hasPublishedBundles = cache(async (): Promise<boolean> => {
  try {
    const response = await apiFetch<Bundle[] | { results?: Bundle[]; count?: number }>(
      "/catalog/bundles/",
      {
        params: { page_size: 1 },
        next: { revalidate: 300 },
      }
    );
    const metaCount = response.meta?.pagination?.count;
    if (typeof metaCount === "number") {
      return metaCount > 0;
    }
    const payload = response.data;
    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      typeof (payload as { count?: unknown }).count === "number"
    ) {
      return ((payload as { count: number }).count || 0) > 0;
    }
    return asArray<Bundle>(payload).length > 0;
  } catch (e) {
    logger.error("hasPublishedBundles fetch failed", e);
    return false;
  }
});

export const getBundles = cache(
  async (): Promise<Bundle[]> => {
    try {
      const response = await apiFetch<Bundle[]>(
        "/catalog/bundles/",
        { next: { revalidate: 300 } }
      );
      const bundles = asArray<Bundle>(response.data);
      return bundles.sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured)
      );
    } catch (e) {
      logger.error("getBundles fetch failed", e);
      return [];
    }
  }
);

export const getBundle = cache(
  async (slug: string): Promise<Bundle | null> => {
    try {
      const response = await apiFetch<Bundle>(`/catalog/bundles/${slug}/`, {
        next: { revalidate: 300 },
      });
      return response.data ?? null;
    } catch (e) {
      logger.error(`getBundle(${slug}) fetch failed`, e);
      return null;
    }
  }
);

export const getBundleProducts = cache(
  async (slug: string): Promise<ProductListItem[]> => {
    try {
      const response = await apiFetch<ProductListItem[]>(
        `/catalog/bundles/${slug}/products/`,
        { next: { revalidate: 300 } }
      );
      return asArray<ProductListItem>(response.data);
    } catch (e) {
      logger.error(`getBundleProducts(${slug}) fetch failed`, e);
      return [];
    }
  }
);

export type BundleReviewSummary = {
  totalCount: number;
  averageRating: number;
};

export function getBundleReviewSummary(
  bundle: Pick<Bundle, "items">
): BundleReviewSummary {
  const lines = bundle.items || [];
  let totalCount = 0;
  let weighted = 0;
  lines.forEach((line) => {
    const count = Number(line.product?.reviews_count) || 0;
    const rating = Number(line.product?.average_rating) || 0;
    if (count > 0) {
      totalCount += count;
      weighted += rating * count;
    }
  });
  return {
    totalCount,
    averageRating: totalCount > 0 ? weighted / totalCount : 0,
  };
}