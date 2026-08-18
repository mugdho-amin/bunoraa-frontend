import { cache } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import type { BlogPostDetail } from "@/lib/types";

export const getBlogPostMeta = cache(async (slug: string) => {
  try {
    const response = await apiFetch<BlogPostDetail>(`/cms/blog/${slug}/`);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      const { notFound } = await import("next/navigation");
      notFound();
    }
    throw error;
  }
});
