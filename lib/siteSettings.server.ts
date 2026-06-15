import { cache } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import type { SiteSettings } from "@/lib/types";
import { logger } from "@/lib/logger";

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  try {
    const response = await apiFetch<SiteSettings>("/pages/settings/", {
      headers: await getServerLocaleHeaders(),
      next: { revalidate: 300 },
    });
    return response.data;
  } catch (e: unknown) {
    if (e instanceof ApiError && (e.message.includes("Dynamic server usage") || e.isDynamicError)) {
      // Expected during static generation if cookies() are used
      return null;
    }
    logger.error("getSiteSettings fetch failed", e);
    return null;
  }
});
