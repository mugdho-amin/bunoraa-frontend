import { cache } from "react";
import { apiFetch } from "@/lib/api";
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
  } catch (e) {
    logger.error("getSiteSettings fetch failed", e);
    return null;
  }
});
