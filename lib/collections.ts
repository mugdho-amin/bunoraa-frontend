import { cache } from "react";
import { apiFetch } from "@/lib/api";
import type { Collection } from "@/lib/types";
import { asArray } from "@/lib/array";
import { logger } from "@/lib/logger";

export const hasPublishedCollections = cache(async (): Promise<boolean> => {
  try {
    const response = await apiFetch<Collection[] | { results?: Collection[]; count?: number }>(
      "/catalog/collections/",
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
    return asArray<Collection>(payload).length > 0;
  } catch (e) {
    logger.error("hasPublishedCollections fetch failed", e);
    return false;
  }
});