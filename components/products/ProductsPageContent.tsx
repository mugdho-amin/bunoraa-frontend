import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import type { ProductListItem, ProductFilterResponse } from "@/lib/types";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildCollectionPage, buildItemList } from "@/lib/seo";
import { buildProductPath } from "@/lib/productPaths";
import { FilterSidebar, FilterSidebarToggle, FilterSidebarProvider } from "@/components/products/FilterSidebar";

const InfiniteProductGrid = dynamic(() => import("@/components/products/InfiniteProductGrid").then((mod) => mod.InfiniteProductGrid));
const FilterPanel = dynamic(() => import("@/components/products/FilterPanel").then((mod) => mod.FilterPanel));
const AppliedFilters = dynamic(() => import("@/components/products/AppliedFilters").then((mod) => mod.AppliedFilters));
const SortMenu = dynamic(() => import("@/components/products/SortMenu").then((mod) => mod.SortMenu));
const MobileFilterSortBar = dynamic(() => import("@/components/products/MobileFilterSortBar").then((mod) => mod.MobileFilterSortBar));
const ViewToggle = dynamic(() => import("@/components/products/ViewToggle").then((mod) => mod.ViewToggle));

type SearchParams = Record<string, string | string[] | undefined>;
type RequestParamValue = string | number | boolean | Array<string | number | boolean> | undefined;

function firstValue(value: string | string[] | undefined): string | undefined { if (Array.isArray(value)) return value[0]; return value; }

function buildFilterScopeParams(searchParams: SearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of ["q", "in_stock", "on_sale", "min_rating", "new_arrivals"]) { const val = firstValue(searchParams[key]); if (val) params[key] = val; }
  Object.entries(searchParams).forEach(([key, value]) => { if (key.startsWith("attr_")) { const val = firstValue(value); if (val) params[key] = val; } });
  return params;
}

function buildProductRequestParams(searchParams: SearchParams): Record<string, RequestParamValue> {
  const params: Record<string, RequestParamValue> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "view" || key === "cols" || key === "page") return;
    if (value === undefined) return;
    if (Array.isArray(value)) { const filtered = value.filter((item) => item.trim() !== ""); if (filtered.length) params[key] = filtered; return; }
    if (value !== "") params[key] = value;
  });
  return params;
}

async function getProducts(searchParams: SearchParams) {
  return apiFetch<ProductListItem[]>("/catalog/products/", { params: buildProductRequestParams(searchParams), headers: await getServerLocaleHeaders(), next: { revalidate: 300 } });
}

async function getFilters(searchParams: SearchParams) {
  const params = buildFilterScopeParams(searchParams);
  const response = await apiFetch<ProductFilterResponse>("/catalog/products/filters/", { params, headers: await getServerLocaleHeaders(), next: { revalidate: 300 } });
  return response.data;
}

export async function ProductsPageContent({ searchParams }: { searchParams: SearchParams }) {
  const rawCols = searchParams.cols;
  const cols = (rawCols === "1" || rawCols === "2" || rawCols === "4" || rawCols === "6") ? Number(rawCols) : 4;

  const [productsResponse, filterData] = await Promise.all([getProducts(searchParams), getFilters(searchParams).catch(() => null)]);
  const rawData = productsResponse.data as ProductListItem[] | { results?: ProductListItem[]; count?: number; next?: string | null; previous?: string | null };
  const products = Array.isArray(rawData) ? rawData : Array.isArray(rawData?.results) ? rawData.results : [];
  const pagination = productsResponse.meta?.pagination || (rawData && !Array.isArray(rawData) ? { count: rawData.count ?? products.length, next: rawData.next ?? null, previous: rawData.previous ?? null, page: 1, page_size: products.length, total_pages: rawData.count ? Math.max(1, Math.ceil(rawData.count / Math.max(products.length, 1))) : 1 } : undefined);
  const totalCount = pagination?.count ?? products.length;
  const showFilters = totalCount > 1;
  const requestParams = buildProductRequestParams(searchParams);

  const listId = "/products/#itemlist";
  const productList = buildItemList(products.slice(0, 50).map((product) => ({ name: product.name, url: buildProductPath(product), image: (product.primary_image as string | undefined) || undefined, description: product.short_description || undefined })), "Products", listId);
  const collectionPage = buildCollectionPage({ name: "Products", description: "Shop the Bunoraa catalog.", url: "/products/", itemListId: listId });

  return (
    <FilterSidebarProvider>
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-content px-[var(--page-gutter)] py-8 sm:py-10 lg:pb-12">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-xl font-semibold uppercase tracking-[0.12em] sm:text-2xl lg:text-3xl">
            Products
          </h1>
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            {showFilters && (
              <FilterSidebarToggle className="border border-border/60 hover:border-primary/40" />
            )}
            <SortMenu className="border border-border/60 hover:border-primary/40" />
            <ViewToggle className="h-10 border border-border/60 hover:border-primary/40" />
          </div>
          {showFilters ? <MobileFilterSortBar filters={filterData} productCount={totalCount} /> : null}
        </div>

        <div
          className={
            showFilters
              ? "mt-6 grid gap-6 sm:mt-8 lg:grid-cols-[auto_1fr] lg:gap-6"
              : "mt-6 grid gap-6 sm:mt-8"
          }
        >
          {showFilters && (
            <FilterSidebar>
              <FilterPanel filters={filterData} productCount={totalCount} />
            </FilterSidebar>
          )}
          <div className="min-w-0 space-y-5 sm:space-y-6 -mx-[var(--page-gutter)] px-[var(--page-gutter)] lg:mx-0 lg:px-0">
            <AppliedFilters variant="minimal" />
            <InfiniteProductGrid
              endpoint="/catalog/products/"
              requestParams={requestParams}
              initialProducts={products}
              initialPagination={pagination}
              resetKey={JSON.stringify({
                endpoint: "/catalog/products/",
                params: requestParams,
                cols,
              })}
              cols={cols}
              cardStyle="minimal"
            />
          </div>
        </div>
      </div>
      {products.length ? <JsonLd data={[collectionPage, productList]} /> : null}
    </div>
    </FilterSidebarProvider>
  );
}
