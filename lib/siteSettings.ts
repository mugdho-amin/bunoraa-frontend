import { apiFetch } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const response = await apiFetch<SiteSettings>("/pages/settings/");
  return response.data;
}
