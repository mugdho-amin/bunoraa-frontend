import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildCollectionPage, buildItemList, buildPageMetadata } from "@/lib/seo";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { getTranslations } from "@/lib/i18n.server";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = buildPageMetadata({
  title: "Product Categories",
  description: "Explore Bunoraa categories to find products by type and style.",
  path: "/categories/",
});

type Category = {
  id: string;
  name: string;
  slug: string;
  slug_path?: string | null;
  path?: string;
  image?: string | null;
  icon?: string | null;
  product_count?: number;
};

async function getCategories() {
  const response = await apiFetch<Category[]>("/catalog/categories/", {
    params: { parent_id: "null" }
  });
  return response.data;
}

export default async function CategoriesPage() {
  const { t } = await getTranslations();
  const categories = await getCategories();
  
  if (!categories || categories.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-2xl font-bold text-foreground/40 uppercase tracking-widest">{t("common.search.no_results")}</h1>
        <Link href="/" className="mt-4 text-primary underline underline-offset-4 font-bold uppercase text-xs tracking-widest">{t("common.error.go_home")}</Link>
      </div>
    );
  }

  const listId = "/categories/#itemlist";
  const list = buildItemList(
    categories.map((category) => ({
      name: category.name,
      url: buildCategoryPath(category.slug_path || category.slug),
      image: category.image || undefined,
      description: undefined,
    })),
    t("common.header.categories") || "Categories",
    listId
  );
  const collectionPage = buildCollectionPage({
    name: t("common.header.categories") || "Categories",
    description: "Browse Bunoraa product categories.",
    url: "/categories/",
    itemListId: listId,
  });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-16 lg:py-24">
        <div className="mb-12 text-center sm:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/5 px-3 py-1.5 rounded-full inline-block mb-4">
            {t("common.search.explore_categories")}
          </span>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-foreground/90">
            {t("common.header.categories")}
          </h1>
          <p className="mt-4 text-lg text-foreground/50 max-w-2xl leading-relaxed">
            Discover our meticulously crafted artisans products, organized by style and purpose.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <div 
              key={category.id} 
              className="group flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Link
                href={buildCategoryPath(category.slug_path || category.slug)}
                className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-muted shadow-2xl shadow-primary/5 transition-all duration-500 hover:scale-[1.02] active:scale-95"
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={`Shop ${category.name}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index < 3}
                    quality={85}
                  />
                ) : (
                   <div className="h-full w-full flex items-center justify-center text-foreground/20 font-black uppercase tracking-tighter text-3xl">
                      {category.name}
                   </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                   <span className="text-white text-xs font-black uppercase tracking-[0.2em]">Explore Collection</span>
                   <div className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center">
                      <ChevronRight size={20} />
                   </div>
                </div>
              </Link>

              <div className="flex items-start justify-between px-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                    {category.name}
                  </h2>
                  {typeof category.product_count === "number" ? (
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">
                      {category.product_count} products available
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <JsonLd data={[collectionPage, list]} />
    </div>
  );
}
