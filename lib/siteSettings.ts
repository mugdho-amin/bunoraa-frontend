import { apiFetch } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";
import { logger } from "@/lib/logger";

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  try {
    const response = await apiFetch<SiteSettings>("/cms/settings/");
    return response.data;
  } catch (e) {
    logger.error("fetchSiteSettings failed", e);
    return null;
  }
}
