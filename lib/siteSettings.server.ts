import { cache } from "react";
import { apiFetch } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { logger } from "@/lib/logger";

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  try {
    const response = await apiFetch<SiteSettings>("/cms/settings/", {
      next: { revalidate: 300 },
    });
    return response.data;
  } catch (e: unknown) {
    logger.error("getSiteSettings fetch failed", e);
    return null;
  }
});

export const getMaintenanceMode = cache(async (): Promise<boolean> => {
  try {
    const response = await apiFetch<SiteSettings>("/cms/settings/", {
      next: { revalidate: 30 },
    });
    return response.data?.maintenance_mode === true;
  } catch (e: unknown) {
    logger.error("getMaintenanceMode fetch failed", e);
    return false;
  }
});
