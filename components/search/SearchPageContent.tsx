import dynamic from "next/dynamic";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { ProductListItem, ProductFilterResponse } from "@/lib/types";
import type { CategoryFacet } from "@/components/products/FilterPanel";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { buildItemList, buildSearchResultsPage } from "@/lib/seo";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { buildProductPath } from "@/lib/productPaths";
import { getTranslations } from "@/lib/i18n.server";

const ProductGrid = dynamic(() => import("@/components/products/ProductGrid").then((mod) => mod.ProductGrid));
const FilterPanel = dynamic(() => import("@/components/products/FilterPanel").then((mod) => mod.FilterPanel));
const FilterDrawer = dynamic(() => import("@/components/products/FilterDrawer").then((mod) => mod.FilterDrawer));
const AppliedFilters = dynamic(() => import("@/components/products/AppliedFilters").then((mod) => mod.AppliedFilters));
const SortMenu = dynamic(() => import("@/components/products/SortMenu").then((mod) => mod.SortMenu));
const ViewToggle = dynamic(() => import("@/components/products/ViewToggle").then((mod) => mod.ViewToggle));
const RecentlyViewedSection = dynamic(() => import("@/components/products/RecentlyViewedSection").then((mod) => mod.RecentlyViewedSection));

type SearchParams = Record<string, string | string[] | undefined>;
type SearchResponse = { products: ProductListItem[]; categories: Array<{ id: string; name: string; slug: string; slug_path?: string | null }>; query: string };

async function getSearchMeta(query: string) { const response = await apiFetch<SearchResponse>("/catalog/search/", { params: { q: query }, headers: await getServerLocaleHeaders(), next: { revalidate: 300 } }); return response.data; }

async function getProducts(searchParams: SearchParams) {
  const params: Record<string, string | number | boolean | Array<string | number | boolean> | undefined> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "view" || key === "cols") return;
    if (value === undefined) return;
    if (Array.isArray(value)) { const filtered = value.filter(v => String(v).trim() !== ""); if (filtered.length > 0) params[key] = filtered; return; }
    if (typeof value === "string") { const trimmed = value.trim(); if (key === "q" && trimmed !== "") { params.search = trimmed; return; } if (key === "page") { params[key] = Number(trimmed) || 1; return; } if (trimmed !== "") params[key] = trimmed; }
  });
  return apiFetch<ProductListItem[]>("/catalog/products/", { params, headers: await getServerLocaleHeaders() });
}

async function getFilters(query: string) { const response = await apiFetch<ProductFilterResponse>("/catalog/products/filters/", { params: query ? { q: query } : undefined, headers: await getServerLocaleHeaders(), next: { revalidate: 300 } }); return response.data; }

async function getCategoryFacets(slug: string) { const response = await apiFetch<CategoryFacet[]>(`/catalog/categories/${slug}/facets/`, { headers: await getServerLocaleHeaders() }); return response.data; }

export async function SearchPageContent({ searchParams }: { searchParams: SearchParams }) {
  const { t } = await getTranslations();
  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const rawCols = searchParams.cols;
  const cols = rawCols === "2" || rawCols === "6" ? Number(rawCols) : 4;
  const currentPage = Number(searchParams.page || 1) || 1;

  if (!query) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold">{t("common.search.catalog_search")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("common.search.no_query")}</p>
        </div>
      </div>
    );
  }

  const [meta, productsResponse, filterData] = await Promise.all([
    getSearchMeta(query), getProducts(searchParams), getFilters(query).catch(() => null),
  ]);

  const facetCategory = (typeof searchParams.category === "string" && searchParams.category) || meta.categories[0]?.slug || "";
  const facets = facetCategory ? await getCategoryFacets(facetCategory).catch(() => []) : [];

  const rawData = productsResponse.data as ProductListItem[] | { results?: ProductListItem[]; count?: number; next?: string | null; previous?: string | null };
  const products = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.results) ? rawData.results : [];

  const listId = `/search/?q=${encodeURIComponent(query)}#itemlist`;
  const productList = buildItemList(products.slice(0, 50).map((product) => ({ name: product.name, url: buildProductPath(product), image: (product.primary_image as string | undefined) || undefined, description: product.short_description || undefined })), `${t("common.search.results_for")} "${query}"`, listId);
  const searchPageSchema = buildSearchResultsPage({ name: `${t("common.search.results_for")} "${query}"`, description: `Products matching "${query}".`, url: `/search/?q=${encodeURIComponent(query)}`, itemListId: listId });

  const pagination = productsResponse.meta?.pagination || (rawData && !Array.isArray(rawData) ? { count: rawData.count ?? products.length, next: rawData.next ?? null, previous: rawData.previous ?? null, page: currentPage, page_size: products.length, total_pages: rawData.count ? Math.max(1, Math.ceil(rawData.count / Math.max(products.length, 1))) : 1 } : undefined);
  const totalCount = pagination?.count ?? products.length;
  const showFilters = totalCount > 1;
  const showPagination = (pagination?.total_pages ? pagination.total_pages > 1 : totalCount > products.length) && products.length > 0;
  const showRecentlyViewed = totalCount > 1;

  const baseParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "page" || value === undefined) return;
    if (Array.isArray(value)) { value.forEach((item) => baseParams.append(key, item)); } else if (value !== "") { baseParams.set(key, value); }
  });
  const pageLink = (page: number) => { const params = new URLSearchParams(baseParams.toString()); params.set("page", String(page)); return `?${params.toString()}`; };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-content px-[var(--page-gutter)] py-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{t("common.search.results_for")} &quot;{query}&quot;</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {showFilters ? <FilterDrawer filters={filterData} facets={facets} productCount={totalCount} className="lg:hidden" /> : null}
            <SortMenu /><ViewToggle />
          </div>
        </div>

        {meta.categories.length ? (
          <div className="mb-6 flex flex-wrap gap-2">
            {meta.categories.map((category) => (
              <Link key={category.id} className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary" href={buildCategoryPath(category.slug_path || category.slug)}>{category.name}</Link>
            ))}
          </div>
        ) : null}

        <div className={showFilters ? "grid gap-8 lg:grid-cols-[260px_1fr]" : "grid gap-8"}>
          {showFilters ? <aside className="hidden lg:block"><FilterPanel filters={filterData} facets={facets} productCount={totalCount} /></aside> : null}
          <div className="space-y-6 -mx-3 sm:-mx-5 lg:mx-0">
            <AppliedFilters />
            <ProductGrid products={products} cols={cols} emptyMessage={t("common.search.no_results")} />
            {showPagination ? (
              <div className="mt-10 flex items-center justify-between">
                {pagination?.previous ? <Button asChild variant="ghost" size="sm"><Link href={pageLink(currentPage - 1)}>{t("common.search.previous")}</Link></Button> : <span className="rounded-xl px-4 py-2 text-sm text-muted-foreground">{t("common.search.previous")}</span>}
                <span className="text-sm text-muted-foreground">{t("common.search.page")} {currentPage}{pagination?.total_pages ? ` ${t("common.search.of")} ${pagination.total_pages}` : ""}</span>
                {pagination?.next ? <Button asChild variant="ghost" size="sm"><Link href={pageLink(currentPage + 1)}>{t("common.search.next")}</Link></Button> : <span className="rounded-xl px-4 py-2 text-sm text-muted-foreground">{t("common.search.next")}</span>}
              </div>
            ) : null}
          </div>
        </div>
        {showRecentlyViewed ? <div className="mt-12"><RecentlyViewedSection /></div> : null}
      </div>
      {products.length ? <JsonLd data={[searchPageSchema, productList]} /> : null}
    </div>
  );
}
