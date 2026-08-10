import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { getServerLang } from "@/lib/serverLocale";
import { apiFetch, ApiError } from "@/lib/api";
import type { Bundle } from "@/lib/types";
import { BundleDetailClient } from "@/components/bundles/BundleDetailClient";
import { getBundleReviewSummary } from "@/lib/bundles";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildBreadcrumbList,
  buildItemList,
  buildPageKeywords,
  buildPageMetadata,
} from "@/lib/seo";
import { buildProductPath } from "@/lib/productPaths";

export const getBundle = cache(async (slug: string) => {
  try {
    const response = await apiFetch<Bundle>(`/catalog/bundles/${slug}/`, {
      headers: await getServerLocaleHeaders(),
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
});

export async function generateBundleMetadata(slug: string): Promise<Metadata> {
  const [bundle, lang] = await Promise.all([getBundle(slug), getServerLang()]);
  return buildPageMetadata({
    title: bundle.meta_title || bundle.name,
    description:
      bundle.meta_description ||
      bundle.description ||
      `Explore products included in the ${bundle.name} bundle.`,
    path: `/bundles/${bundle.slug}/`,
    keywords: buildPageKeywords(bundle.name, bundle.description, undefined, lang),
    lang,
  });
}

export async function BundleDetailPageContent({ slug }: { slug: string }) {
  const bundle = await getBundle(slug);
  if (!bundle) notFound();

  const bundleUrl = `/bundles/${bundle.slug}/`;
  const products = (bundle.items || []).map((line) => line.product);
  const reviewSummary = getBundleReviewSummary(bundle);

  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: "/" },
    { name: "Bundles", url: "/bundles/" },
    { name: bundle.name, url: bundleUrl },
  ]);
  const productList = buildItemList(
    products.slice(0, 50).map((product) => ({
      name: product.name,
      url: buildProductPath(product),
      image: (product.primary_image as string | undefined) || undefined,
      description: product.short_description || undefined,
    })),
    `${bundle.name} items`
  );

  const jsonLd: Array<Record<string, unknown>> = [
    breadcrumbs,
    ...(products.length ? [productList] : []),
    ...(reviewSummary.totalCount > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: bundle.name,
            image: bundle.image,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: reviewSummary.averageRating.toFixed(1),
              reviewCount: reviewSummary.totalCount,
              bestRating: "5",
            },
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-content px-[var(--page-gutter)] pt-6 sm:pt-10">
        <nav className="mb-5 hidden text-xs text-muted-foreground sm:block">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/bundles/" className="hover:text-primary">Bundles</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{bundle.name}</span>
        </nav>

        <BundleDetailClient bundle={bundle} />
      </div>

      <JsonLd data={jsonLd} />
    </div>
  );
}