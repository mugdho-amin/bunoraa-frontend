import { cache } from "react";
import { apiFetch } from "@/lib/api";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import type { SiteSettings } from "@/lib/types";

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  try {
    const response = await apiFetch<SiteSettings>("/pages/settings/", {
      headers: await getServerLocaleHeaders(),
    });
    return response.data;
  } catch {
    return null;
  }
});
