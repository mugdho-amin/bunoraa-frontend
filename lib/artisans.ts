import { cache } from "react";
import { apiFetch } from "@/lib/api";
import type { Artisan } from "@/lib/types";

export const tryGetArtisanMeta = cache(async (slug: string) => {
  try { const response = await apiFetch<Artisan>(`/artisans/${slug}/`); return response.data; }
  catch { return null; }
});
