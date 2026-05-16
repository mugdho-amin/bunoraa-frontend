import type { Metadata } from "next";
import {
  buildCategoryMetadataForPath,
  renderCategoryPageForPath,
  type CategorySearchParams,
} from "@/app/categories/[...slug]/categoryPageShared";

const ROOT = "home-decor";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<CategorySearchParams>;
}): Promise<Metadata> {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const slugPath = [ROOT, ...(slug || [])].join("/");
  return buildCategoryMetadataForPath(slugPath, resolvedSearchParams);
}

export default async function HomeDecorCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<CategorySearchParams>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const slugPath = [ROOT, ...(slug || [])].join("/");
  return renderCategoryPageForPath(slugPath, resolvedSearchParams);
}
