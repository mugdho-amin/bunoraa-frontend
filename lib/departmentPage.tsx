import "server-only";

import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import type { ProductDetail, ProductListItem } from "@/lib/types";
import type { CategorySearchParams } from "@/app/categories/[...slug]/categoryPageShared";
export type { CategorySearchParams };
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/products/ProductDetailClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { getServerLocaleHeaders, getServerLang } from "@/lib/serverLocale";
import {
  buildBreadcrumbList,
  buildPageMetadata,
  buildProductSchema,
  buildProductKeywords,
} from "@/lib/seo";
import { buildCategoryPath } from "@/lib/categoryPaths";
import {
  buildProductCategoryTrail,
  buildProductPath,
} from "@/lib/productPaths";
import {
  buildCategoryMetadataForPath,
  renderCategoryPageForPath,
} from "@/app/categories/[...slug]/categoryPageShared";
import { categoryPathExists } from "@/lib/routeLookup";

async function getProduct(slug: string) {
  try {
    const response = await apiFetch<ProductDetail>(`/catalog/products/${slug}/`, {
      headers: await getServerLocaleHeaders(),
      suppressError: true,
      suppressErrorStatus: [404],
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function getRelated(slug: string) {
  const response = await apiFetch<ProductListItem[]>(
    `/catalog/products/${slug}/related/`,
    { params: { limit: 8 }, headers: await getServerLocaleHeaders() }
  );
  return response.data;
}

function toProductSlug(rest: string[]) {
  return rest.at(-1) || "";
}

export async function departmentMetadata(
  rootCategory: string,
  slug: string[] | undefined,
  resolvedSearchParams: CategorySearchParams,
): Promise<Metadata> {
  const slugPath = [rootCategory, ...(slug || [])].join("/");

  if (slugPath && (await categoryPathExists(slugPath))) {
    return buildCategoryMetadataForPath(slugPath, resolvedSearchParams);
  }

  const productSlug = toProductSlug(slug || []);
  if (!productSlug || !slug?.length) {
    return buildCategoryMetadataForPath(slugPath || rootCategory, resolvedSearchParams);
  }

  const [product, lang] = await Promise.all([getProduct(productSlug), getServerLang()]);
  if (!product) {
    return buildCategoryMetadataForPath(slugPath, resolvedSearchParams);
  }

  const metadataImages = [
    product.primary_image || undefined,
    ...(product.images?.slice(0, 5).map((image) => image.image) || []),
  ];
  const productKeywords = buildProductKeywords(product, lang);

  return buildPageMetadata({
    title: product.meta_title || product.name,
    description:
      product.meta_description ||
      product.short_description ||
      product.description ||
      "Explore product details on Bunoraa.",
    path: buildProductPath(product),
    images: metadataImages,
    keywords: productKeywords,
    lang,
  });
}

export async function departmentPage(
  rootCategory: string,
  slug: string[] | undefined,
  resolvedSearchParams: CategorySearchParams,
) {
  const slugPath = [rootCategory, ...(slug || [])].join("/");

  if (slugPath && (await categoryPathExists(slugPath))) {
    return renderCategoryPageForPath(slugPath, resolvedSearchParams);
  }

  if (!slug?.length) {
    notFound();
  }

  const productSlug = toProductSlug(slug);
  if (!productSlug) {
    notFound();
  }

  const product = await getProduct(productSlug);
  if (!product) {
    notFound();
  }
  const relatedProducts = await getRelated(productSlug).catch(() => []);

  const canonicalPath = buildProductPath(product);

  const categoryTrail = buildProductCategoryTrail(product);
  const breadcrumbItems = [{ name: "Home", url: "/" }];
  categoryTrail.forEach((crumb) => {
    breadcrumbItems.push({ name: crumb.name, url: buildCategoryPath(crumb.slugPath) });
  });
  breadcrumbItems.push({ name: product.name, url: canonicalPath });

  const breadcrumbs = buildBreadcrumbList(breadcrumbItems);
  const productSchema = product.schema_org || buildProductSchema(product);
  const jsonLd = [breadcrumbs, ...(productSchema ? [productSchema] : [])];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 py-12">
        <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      </div>
      <JsonLd data={jsonLd} />
    </div>
  );
}
