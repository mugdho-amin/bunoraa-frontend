import type { Metadata } from "next";
import dynamic from "next/dynamic";
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

const PreorderCategoriesPageContent = dynamic(
  () => import("@/components/preorders/PreorderCategoriesPageContent").then((mod) => mod.PreorderCategoriesPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-foreground/60">Loading categories...</div> }
);

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
