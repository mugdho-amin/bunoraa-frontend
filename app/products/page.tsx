import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import type { ProductListItem, ProductFilterResponse } from "@/lib/types";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildCollectionPage, buildItemList, buildPageMetadata } from "@/lib/seo";
import { buildProductPath } from "@/lib/productPaths";
const InfiniteProductGrid = dynamic(
  () =>
    import("@/components/products/InfiniteProductGrid").then(
      (mod) => mod.InfiniteProductGrid
    )
);
const FilterPanel = dynamic(
  () => import("@/components/products/FilterPanel").then((mod) => mod.FilterPanel)
);
const FilterDrawer = dynamic(
  () => import("@/components/products/FilterDrawer").then((mod) => mod.FilterDrawer)
);
const AppliedFilters = dynamic(
  () => import("@/components/products/AppliedFilters").then((mod) => mod.AppliedFilters)
);
const SortMenu = dynamic(
  () => import("@/components/products/SortMenu").then((mod) => mod.SortMenu)
);

type SearchParams = Record<string, string | string[] | undefined>;
type RequestParamValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | undefined;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function hasIndexBustingFilters(searchParams: SearchParams): boolean {
  return Object.entries(searchParams).some(([key, value]) => {
    if (key === "page" || key === "view") return false;
    if (Array.isArray(value)) return value.some((entry) => entry.trim() !== "");
    return Boolean(value && value.trim() !== "");
  });
}

function parsePageNumber(searchParams: SearchParams): number {
  const rawPage = firstValue(searchParams.page);
  const page = Number(rawPage || 1);
  return Number.isFinite(page) && page > 1 ? Math.floor(page) : 1;
}

function buildProductRequestParams(
  searchParams: SearchParams,
  page?: number
): Record<string, RequestParamValue> {
  const params: Record<string, RequestParamValue> = {};

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "view") return;
    if (key === "page") return;
    if (value === undefined) return;
    if (Array.isArray(value)) {
      params[key] = value.filter((item) => item.trim() !== "");
      return;
    }
    if (value !== "") {
      params[key] = value;
    }
  });

  if (page && page > 1) {
    params.page = page;
  }

  return params;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const resolved = await searchParams;
  const page = parsePageNumber(resolved);
  const hasFilters = hasIndexBustingFilters(resolved);
  const base = buildPageMetadata({
    title: "Shop Products",
    description: "Browse all Bunoraa products, new arrivals, and best-value picks.",
    path: page > 1 && !hasFilters ? `/products/?page=${page}` : "/products/",
  });

  if (!hasFilters) {
    return base;
  }

  return {
    ...base,
    alternates: {
      canonical: "/products/",
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

async function getProducts(searchParams: SearchParams) {
  return apiFetch<ProductListItem[]>("/catalog/products/", {
    params: buildProductRequestParams(searchParams, parsePageNumber(searchParams)),
    headers: await getServerLocaleHeaders()
  });
}

async function getFilters(searchParams: SearchParams) {
  const params: Record<string, string> = {};
  if (searchParams.q && typeof searchParams.q === "string") {
    params.q = searchParams.q;
  }
  const response = await apiFetch<ProductFilterResponse>("/catalog/products/filters/", {
    params,
    headers: await getServerLocaleHeaders(),
    cache: "no-store",
  });
  return response.data;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const currentPage = Number(resolved.page || 1) || 1;
  const view = resolved.view === "list" ? "list" : "grid";
  const filterParams =
    resolved.q && typeof resolved.q === "string" && resolved.q.trim()
      ? { q: resolved.q }
      : undefined;

  const [productsResponse, filterData] = await Promise.all([
    getProducts(resolved),
    getFilters(resolved).catch(() => null),
  ]);

  const rawData = productsResponse.data as
    | ProductListItem[]
    | {
        results?: ProductListItem[];
        count?: number;
        next?: string | null;
        previous?: string | null;
      };

  const products = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.results)
    ? rawData.results
    : [];

  const pagination =
    productsResponse.meta?.pagination ||
    (rawData && !Array.isArray(rawData)
      ? {
          count: rawData.count ?? products.length,
          next: rawData.next ?? null,
          previous: rawData.previous ?? null,
          page: currentPage,
          page_size: products.length,
          total_pages: rawData.count
            ? Math.max(1, Math.ceil(rawData.count / Math.max(products.length, 1)))
            : 1,
        }
      : undefined);
  const totalCount = pagination?.count ?? products.length;
  const showFilters = totalCount > 1;
  const requestParams = buildProductRequestParams(resolved);

  const listId = "/products/#itemlist";
  const productList = buildItemList(
    products.slice(0, 50).map((product) => ({
      name: product.name,
      url: buildProductPath(product),
      image: (product.primary_image as string | undefined) || undefined,
      description: product.short_description || undefined,
    })),
    "Products",
    listId
  );
  const collectionPage = buildCollectionPage({
    name: "Products",
    description: "Shop the Bunoraa catalog.",
    url: "/products/",
    itemListId: listId,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold uppercase tracking-[0.12em] sm:text-3xl">
            Products
          </h1>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            {showFilters ? (
              <FilterDrawer
                filters={filterData}
                productCount={totalCount}
                className="lg:hidden"
                filterParams={filterParams}
              />
            ) : null}
            <SortMenu />
          </div>
        </div>

        <div className={showFilters ? "mt-8 grid gap-8 lg:grid-cols-[220px_1fr]" : "mt-8 grid gap-8"}>
          {showFilters ? (
            <aside className="hidden lg:block">
              <FilterPanel
                filters={filterData}
                productCount={totalCount}
                filterParams={filterParams}
              />
            </aside>
          ) : null}
          <div className="space-y-6">
            <AppliedFilters variant="minimal" />
            <InfiniteProductGrid
              endpoint="/catalog/products/"
              requestParams={requestParams}
              initialProducts={products}
              initialPagination={pagination}
              resetKey={JSON.stringify({
                endpoint: "/catalog/products/",
                params: requestParams,
                view,
              })}
              view={view}
              cardStyle="minimal"
            />
          </div>
        </div>
      </div>
      {products.length ? <JsonLd data={[collectionPage, productList]} /> : null}
    </div>
  );
}
