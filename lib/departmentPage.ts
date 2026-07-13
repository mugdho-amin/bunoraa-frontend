import "server-only";

import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import type { ProductDetail } from "@/lib/types";
import type { CategorySearchParams } from "@/app/categories/[...slug]/categoryPageShared";
export type { CategorySearchParams };
import { notFound, redirect } from "next/navigation";
import { getServerLocaleHeaders, getServerLang } from "@/lib/serverLocale";
import { buildPageMetadata, buildProductKeywords } from "@/lib/seo";
import { buildProductPath } from "@/lib/productPaths";
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

  redirect(buildProductPath(product));
}
