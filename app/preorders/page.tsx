import type { Metadata } from "next";
import { PreorderCategoriesPageContent } from "@/components/preorders/PreorderCategoriesPageContent";
import { apiFetch } from "@/lib/api";
import type { PreorderCategory } from "@/lib/types";
import { asArray } from "@/lib/array";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Custom Preorders",
  description:
    "Start a Bunoraa preorder for custom production, timelines, approvals, and delivery.",
  path: "/preorders/",
});

async function getCategories() {
  try {
    const response = await apiFetch<PreorderCategory[]>("/preorders/categories/", {});
    return asArray<PreorderCategory>(response.data);
  } catch {
    return [];
  }
}

export default async function PreorderCategoriesPage() {
  const categories = await getCategories();
  return <PreorderCategoriesPageContent categories={categories} />;
}
