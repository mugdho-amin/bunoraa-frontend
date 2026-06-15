import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import type { ProductListItem, ProductFilterResponse } from "@/lib/types";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbList, buildCollectionPage, buildItemList } from "@/lib/seo";
import { buildProductPath } from "@/lib/productPaths";
import { notFound } from "next/navigation";

type CategoryDetail = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

const ProductGrid = dynamic(() => import("@/components/products/ProductGrid").then((mod) => mod.ProductGrid));
const FilterPanel = dynamic(() => import("@/components/products/FilterPanel").then((mod) => mod.FilterPanel));
const AppliedFilters = dynamic(() => import("@/components/products/AppliedFilters").then((mod) => mod.AppliedFilters));
const SortMenu = dynamic(() => import("@/components/products/SortMenu").then((mod) => mod.SortMenu));
const ViewToggle = dynamic(() => import("@/components/products/ViewToggle").then((mod) => mod.ViewToggle));
const MobileFilterSortBar = dynamic(() => import("@/components/products/MobileFilterSortBar").then((mod) => mod.MobileFilterSortBar));

type SearchParams = Record<string, string | string[] | undefined>;

async function getCategory(slugPath: string) {
  const response = await apiFetch<CategoryDetail>(`/catalog/categories/by-path/${slugPath}/`, { headers: await getServerLocaleHeaders() });
  return response.data;
}

async function getProducts(slugPath: string, searchParams: SearchParams) {
  const params: Record<string, string | number | boolean | Array<string | number | boolean> | undefined> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "view" || key === "cols" || key === "page") return;
    if (Array.isArray(value)) { const filtered = value.filter(Boolean); if (filtered.length) params[key] = filtered; }
    else if (value) params[key] = value;
  });
  params.category_path = slugPath;
  return apiFetch<ProductListItem[]>("/catalog/products/", { params, headers: await getServerLocaleHeaders(), next: { revalidate: 300 } });
}

async function getFilters(slugPath: string) {
  const response = await apiFetch<ProductFilterResponse>("/catalog/products/filters/", { params: { category_path: slugPath }, headers: await getServerLocaleHeaders(), next: { revalidate: 300 } });
  return response.data;
}

async function getChildCategories(slugPath: string) {
  const response = await apiFetch<Array<{ id: string; name: string; slug: string; slug_path?: string | null; product_count?: number | null; image?: string | null }>>(`/catalog/categories/by-path/${slugPath}/children/`, { headers: await getServerLocaleHeaders() });
  return response.data;
}

export async function CategoriesSlugPageContent({ slug, searchParams }: { slug: string; searchParams: SearchParams }) {
  const category = await getCategory(slug).catch(() => null);
  if (!category) notFound();

  const rawCols = searchParams.cols;
  const cols = (rawCols === "2" || rawCols === "4" || rawCols === "6") ? Number(rawCols) : 4;

  const [productsResponse, filterData, childCategories] = await Promise.all([
    getProducts(slug, searchParams), getFilters(slug).catch(() => null), getChildCategories(slug).catch(() => []),
  ]);

  const rawData = productsResponse.data as ProductListItem[] | { results?: ProductListItem[]; count?: number; next?: string | null; previous?: string | null };
  const products = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.results) ? rawData.results : [];
  const pagination = productsResponse.meta?.pagination || (rawData && !Array.isArray(rawData) ? { count: rawData.count ?? products.length, next: rawData.next ?? null, previous: rawData.previous ?? null, page: 1, page_size: products.length, total_pages: rawData.count ? Math.max(1, Math.ceil(rawData.count / Math.max(products.length, 1))) : 1 } : undefined);
  const totalCount = pagination?.count ?? products.length;
  const showFilters = totalCount > 1;
  const categoryLabel = category.meta_title || category.name;

  const breadcrumbItems = [{ name: "Home", url: "/" }];
  const slugParts = slug.split("/").filter(Boolean);
  if (slugParts.length <= 1) breadcrumbItems.push({ name: "Categories", url: "/categories/" });
  breadcrumbItems.push({ name: category.name, url: `/${slug}/` });

  const breadcrumbs = buildBreadcrumbList(breadcrumbItems);
  const listId = `/${slug}/#itemlist`;
  const productList = buildItemList(products.slice(0, 50).map((product) => ({ name: product.name, url: buildProductPath(product), image: (product.primary_image as string | undefined) || undefined, description: product.short_description || undefined })), categoryLabel, listId);
  const collectionPage = buildCollectionPage({ name: categoryLabel, description: category.description || undefined, url: `/${slug}/`, itemListId: listId });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-5 py-10 lg:pb-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-semibold uppercase tracking-[0.12em] sm:text-3xl">{categoryLabel}</h1>{category.description ? <p className="mt-1 text-sm text-foreground/70">{category.description}</p> : null}</div>
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <SortMenu className="border border-border/60 hover:border-primary/40" />
            <ViewToggle className="h-10 border border-border/60 hover:border-primary/40" />
          </div>
          {showFilters ? <MobileFilterSortBar filters={filterData} productCount={totalCount} /> : null}
        </div>

        {childCategories.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {childCategories.map((child) => (
              <a key={child.id} href={`/${child.slug_path || child.slug}/`} className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary">
                {child.name}{typeof child.product_count === "number" ? <span className="ml-2 text-xs text-foreground/60">{child.product_count}</span> : null}
              </a>
            ))}
          </div>
        ) : null}

        <div className={showFilters ? "mt-8 grid gap-8 lg:grid-cols-[260px_1fr]" : "mt-8 grid gap-8"}>
          {showFilters ? <aside className="hidden lg:block"><FilterPanel filters={filterData} productCount={totalCount} /></aside> : null}
          <div className="space-y-6 -mx-3 sm:-mx-5 lg:mx-0">
            <AppliedFilters />
            <ProductGrid products={products} cols={cols} />
          </div>
        </div>
      </div>
      <JsonLd data={[collectionPage, breadcrumbs, productList]} />
    </div>
  );
}
