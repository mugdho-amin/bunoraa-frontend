import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { CategoriesPageContent } from "@/components/categories/CategoriesPageContent";

export const metadata: Metadata = buildPageMetadata({
  title: "Product Categories",
  description: "Explore Bunoraa categories to find products by type and style.",
  path: "/categories/",
});

export default function CategoriesPage() {
  return <CategoriesPageContent />;
}
