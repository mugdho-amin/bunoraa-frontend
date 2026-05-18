import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import type { ProductListItem, ProductFilterResponse } from "@/lib/types";
import { FilterPanel } from "@/components/products/FilterPanel";
import { FilterDrawer } from "@/components/products/FilterDrawer";
import { AppliedFilters } from "@/components/products/AppliedFilters";
import { InfiniteProductGrid } from "@/components/products/InfiniteProductGrid";
import { SortMenu } from "@/components/products/SortMenu";
import { ViewToggle } from "@/components/products/ViewToggle";
import { notFound } from "next/navigation";
import type { CategoryFacet } from "@/components/products/FilterPanel";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { buildPageMetadata } from "@/lib/seo";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  children?: Array<{
    id: string;
    name: string;
    slug: string;
    product_count?: number | null;
  }>;
};

export type CategorySearchParams = Record<string, string | string[] | undefined>;
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

function hasIndexBustingFilters(searchParams: CategorySearchParams): boolean {
  return Object.entries(searchParams).some(([key, value]) => {
    if (key === "page" || key === "view") return false;
    if (Array.isArray(value)) return value.some((entry) => entry.trim() !== "");
    return Boolean(value && value.trim() !== "");
  });
}

function parsePageNumber(searchParams: CategorySearchParams): number {
  const rawPage = firstValue(searchParams.page);
  const page = Number(rawPage || 1);
  return Number.isFinite(page) && page > 1 ? Math.floor(page) : 1;
}

function buildCategoryProductsParams(
  searchParams: CategorySearchParams,
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

async function getCategory(slug: string) {
  try {
    const response = await apiFetch<Category>(`/catalog/categories/${slug}/`, {
      headers: await getServerLocaleHeaders()
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

async function getCategoryProducts(slug: string, searchParams: CategorySearchParams) {
  const response = await apiFetch<ProductListItem[]>(
    `/catalog/categories/${slug}/products/`,
    {
      params: buildCategoryProductsParams(
        searchParams,
        parsePageNumber(searchParams)
      ),
      headers: await getServerLocaleHeaders(),
      cache: "no-store"
    }
  );
  return response;
}

async function getFilters(slug: string, searchParams: CategorySearchParams) {
  const params: Record<string, string> = { category: slug };
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

async function getCategoryFacets(slug: string) {
  const response = await apiFetch<CategoryFacet[]>(
    `/catalog/categories/${slug}/facets/`,
    { headers: await getServerLocaleHeaders() }
  );
  return response.data;
}

export async function buildCategoryMetadataForPath(
  slugPath: string,
  resolvedSearchParams: CategorySearchParams
): Promise<Metadata> {
  const category = await getCategory(slugPath);
  const page = parsePageNumber(resolvedSearchParams);
  const hasFilters = hasIndexBustingFilters(resolvedSearchParams);
  const basePath = buildCategoryPath(slugPath);
  const metadata = buildPageMetadata({
    title: category.meta_title || category.name,
    description:
      category.meta_description ||
      category.description ||
      `Browse ${category.name} products on Bunoraa.`,
    path: page > 1 && !hasFilters ? `${basePath}?page=${page}` : basePath,
  });

  if (!hasFilters) {
    return metadata;
  }

  return {
    ...metadata,
    alternates: {
      canonical: basePath,
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

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

// ... (keep types and existing helper functions)

export async function renderCategoryPageForPath(
  slugPath: string,
  resolvedSearchParams: CategorySearchParams
) {
  const page = Number(resolvedSearchParams.page || 1) || 1;
  const view = resolvedSearchParams.view === "list" ? "list" : "grid";
  const filterParams: Record<string, string> = { category: slugPath };
  if (resolvedSearchParams.q && typeof resolvedSearchParams.q === "string") {
    filterParams.q = resolvedSearchParams.q;
  }

  const [category, productsResponse, filterData, facets] = await Promise.all([
    getCategory(slugPath),
    getCategoryProducts(slugPath, resolvedSearchParams),
    getFilters(slugPath, resolvedSearchParams).catch(() => null),
    getCategoryFacets(slugPath).catch(() => []),
  ]);
  const childCategories = category.children || [];

  const rawData = productsResponse.data as unknown;
  const products = Array.isArray(rawData) 
    ? (rawData as ProductListItem[]) 
    : ((rawData as Record<string, unknown>)?.results as ProductListItem[]) || [];
    
  const pagination = productsResponse.meta?.pagination || (rawData && !Array.isArray(rawData) ? {
    count: ((rawData as Record<string, unknown>).count as number) ?? products.length,
    next: ((rawData as Record<string, unknown>).next as string | null) ?? null,
    previous: ((rawData as Record<string, unknown>).previous as string | null) ?? null,
    page,
    page_size: products.length,
    total_pages: Math.ceil((((rawData as Record<string, unknown>).count as number) || 0) / (products.length || 1))
  } : undefined);

  const totalCount = pagination?.count ?? products.length;
  const showFilters = Boolean(filterData || facets.length || childCategories.length || totalCount > 0);
  const requestParams = buildCategoryProductsParams(resolvedSearchParams);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    ...slugPath.split("/").map((part, idx, arr) => {
      const currentPath = arr.slice(0, idx + 1).join("/");
      return {
        name: part.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" "),
        url: buildCategoryPath(currentPath)
      };
    })
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        {/* Header Section */}
        <div className="mb-10 space-y-6">
          <Breadcrumbs items={breadcrumbItems} />
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-4">
                {category.name}
              </h1>
              
              {category.description && (
                <div className="relative max-w-3xl group">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full hidden sm:block" />
                  <div className="text-sm sm:text-base text-foreground/80 font-serif italic leading-relaxed">
                    <p className="line-clamp-3 group-hover:line-clamp-none transition-all duration-500 ease-in-out">
                      {category.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
                  {totalCount} Curated Pieces
                </div>
                <div className="h-px flex-1 max-w-[100px] bg-border/60" />
              </div>
            </div>

            {/* Mobile Actions Bar */}
            <div className="sticky top-[var(--header-offset,4.75rem)] z-30 flex items-center gap-2 rounded-2xl border border-border/60 bg-background/80 p-2 shadow-sm backdrop-blur-xl lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="flex flex-1 items-center gap-2 sm:flex-initial">
                {showFilters && (
                  <FilterDrawer
                    filters={filterData}
                    facets={facets}
                    categories={childCategories}
                    productCount={totalCount}
                    className="lg:hidden"
                    filterParams={filterParams}
                    currentCategoryPath={slugPath}
                  />
                )}
                <SortMenu className="h-10 w-full sm:w-auto min-w-[140px] rounded-xl border-border/50 lg:h-11 lg:min-w-[180px]" />
                <ViewToggle className="h-10 border-border/50 lg:h-11" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className={cn("grid gap-10", showFilters ? "lg:grid-cols-[240px_1fr]" : "grid-cols-1")}>
          {showFilters && (
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-8">
                <FilterPanel
                  filters={filterData}
                  facets={facets}
                  categories={childCategories}
                  productCount={totalCount}
                  currentCategoryPath={slugPath}
                  filterParams={filterParams}
                />
              </div>
            </aside>
          )}

          <main className="space-y-8">
            <AppliedFilters />
            
            <div className="relative">
              <InfiniteProductGrid
                endpoint={`/catalog/categories/${slugPath}/products/`}
                requestParams={requestParams}
                initialProducts={products}
                initialPagination={pagination}
                resetKey={JSON.stringify({ endpoint: slugPath, params: requestParams, view })}
                view={view}
                cardStyle="fashion"
                className="min-h-[400px]"
              />
            </div>

            {category.description && (
              <div className="mt-20 border-t border-border/40 pt-16 pb-8 bg-muted/30 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-3xl">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      About the {category.name} Collection
                    </h2>
                    <div className="h-1 w-12 bg-primary mx-auto rounded-full" />
                  </div>
                  
                  <div className="text-sm sm:text-base max-w-none text-foreground/80 leading-relaxed font-serif text-center italic">
                    {category.description.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
