import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import type { PreorderCategory } from "@/lib/types";
import { notFound } from "next/navigation";
import { getServerLang } from "@/lib/serverLocale";
import { buildPageMetadata } from "@/lib/seo";
import { PreorderCategoryPageContent } from "@/components/preorders/PreorderCategoryPageContent";

async function getCategory(slug: string) {
  try {
    const response = await apiFetch<PreorderCategory>(`/preorders/categories/${slug}/`);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [category, lang] = await Promise.all([getCategory(slug), getServerLang()]);
  return buildPageMetadata({
    title: `${category.name} Preorders`,
    description:
      category.description ||
      `Configure custom preorders for ${category.name} at Bunoraa.`,
    path: `/preorders/category/${category.slug}/`,
    images: [category.image],
    lang,
  });
}

export default async function PreorderCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  return <PreorderCategoryPageContent category={category} />;
}
