import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { ProductsPageContent } from "@/components/products/ProductsPageContent";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const resolved = await searchParams;
  const hasFilters = Object.entries(resolved).some(([key, value]) => {
    if (key === "view" || key === "cols") return false;
    if (Array.isArray(value)) return value.some((entry) => entry.trim() !== "");
    return Boolean(value?.trim());
  });
  const base = buildPageMetadata({ title: "Shop Products", description: "Browse all Bunoraa products, new arrivals, and best-value picks.", path: "/products/" });
  if (!hasFilters) return base;
  return { ...base, alternates: { canonical: "/products/" }, robots: { index: false, follow: true, googleBot: { index: false, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 } } };
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolved = await searchParams;
  return <ProductsPageContent searchParams={resolved} />;
}
