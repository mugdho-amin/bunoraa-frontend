import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildCollectionPage, buildItemList } from "@/lib/seo";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { getTranslations } from "@/lib/i18n.server";

type Category = { id: string; name: string; slug: string; slug_path?: string | null; path?: string; image?: string | null; icon?: string | null; product_count?: number };

async function getCategories() { const response = await apiFetch<Category[]>("/catalog/categories/", { params: { parent_id: "null", has_products: true } }); return response.data; }

export async function CategoriesPageContent() {
  const { t } = await getTranslations();
  const categories = await getCategories();
  if (!categories?.length) {
    return <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6"><h1 className="text-2xl font-bold text-muted-foreground uppercase tracking-widest">{t("common.search.no_results")}</h1><Link href="/" className="mt-4 text-primary underline underline-offset-4 font-bold uppercase text-xs tracking-widest">{t("common.error.go_home")}</Link></div>;
  }
  const listId = "/categories/#itemlist";
  const list = buildItemList(categories.map((category) => ({ name: category.name, url: buildCategoryPath(category.slug_path || category.slug), image: category.image || undefined, description: undefined })), t("common.header.categories") || "Categories", listId);
  const collectionPage = buildCollectionPage({ name: t("common.header.categories") || "Categories", description: "Browse Bunoraa product categories.", url: "/categories/", itemListId: listId });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      <div className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] py-16 lg:py-24">
        <div className="mb-12 text-center sm:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/5 px-3 py-1.5 rounded-full inline-block mb-4">{t("common.search.explore_categories")}</span>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-foreground/90">{t("common.header.categories")}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">Discover our meticulously crafted artisans products, organized by style and purpose.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category, index) => (
            <Link key={category.id} href={buildCategoryPath(category.slug_path || category.slug)} className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/90 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image src={category.image || "/placeholder-category.svg"} alt={category.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-all duration-500 group-hover:scale-105" priority={index < 3} loading={index < 3 ? undefined : "lazy"} decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
              </div>
              <div className="relative flex items-center justify-between px-4 sm:px-5 py-4">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground/90">{category.name}</h2>
                <div className="flex items-center gap-2">
                  {typeof category.product_count === "number" ? <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{category.product_count} items</span> : null}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white text-sm font-bold">&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <JsonLd data={[collectionPage, list]} />
    </div>
  );
}
