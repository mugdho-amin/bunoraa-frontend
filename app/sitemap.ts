import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bunoraa.com").replace(/\/+$/, "");
const API_BASE = (process.env.NEXT_INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");

async function fetchAllCursorPages<T>(baseUrl: string, pageSize = 100): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page_size=${pageSize}`;
  while (nextUrl) {
    const res: Response = await fetch(nextUrl, { next: { revalidate: 3600, tags: ["sitemap"] } });
    if (!res.ok) break;
    const json: Record<string, unknown> = await res.json() as Record<string, unknown>;
    const results: T[] = (json.results ?? json.data ?? []) as T[];
    items.push(...results);
    nextUrl = json.next as string | null;
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  const staticPages: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }> = [
    { path: "/", priority: 0.4, changeFrequency: "daily" },
    { path: "/products", priority: 0.9, changeFrequency: "daily" },
    { path: "/preorders", priority: 0.9, changeFrequency: "daily" },
    { path: "/categories", priority: 0.4, changeFrequency: "weekly" },
    { path: "/collections", priority: 0.3, changeFrequency: "weekly" },
    { path: "/bundles", priority: 0.3, changeFrequency: "weekly" },
    { path: "/artisans", priority: 0.3, changeFrequency: "weekly" },
    { path: "/contact", priority: 0.2, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.2, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.5, changeFrequency: "weekly" },
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${SITE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  try {
    const categories = await fetchAllCursorPages<{ slug: string; slug_path?: string; updated_at: string }>(
      `${API_BASE}/catalog/categories/`,
    );
    for (const cat of categories) {
      entries.push({
        url: `${SITE_URL}/${cat.slug_path || cat.slug}/`,
        lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    // sitemap generation should never fail — skip on error
  }

  try {
    const products = await fetchAllCursorPages<{ slug: string; updated_at?: string; primary_category_slug_path?: string }>(
      `${API_BASE}/catalog/products/`,
    );
    for (const product of products) {
      const catPath = product.primary_category_slug_path;
      const loc = catPath ? `/${catPath}/${product.slug}/` : `/products/${product.slug}/`;
      entries.push({
        url: `${SITE_URL}${loc}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      });
    }
  } catch {
    // skip on error
  }

  try {
    const blogResponse = await fetch(`${API_BASE}/pages/blog/`, { next: { revalidate: 3600, tags: ["sitemap"] } });
    if (blogResponse.ok) {
      const blogJson = await blogResponse.json();
      const posts = blogJson.data ?? blogJson.results ?? [];
      for (const post of posts) {
        entries.push({
          url: `${SITE_URL}/blog/${post.slug}/`,
          lastModified: post.published_at || post.updated_at ? new Date(post.published_at || post.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  } catch {
    // skip on error
  }

  return entries;
}
