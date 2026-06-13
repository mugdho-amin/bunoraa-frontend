import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import type { ProductListItem, ProductFilterResponse } from "@/lib/types";
import { FilterSidebar, FilterSidebarToggle, FilterSidebarProvider } from "@/components/products/FilterSidebar";
import { FilterPanel } from "@/components/products/FilterPanel";
import { AppliedFilters } from "@/components/products/AppliedFilters";
import { InfiniteProductGrid } from "@/components/products/InfiniteProductGrid";
import { SortMenu } from "@/components/products/SortMenu";
import { ViewToggle } from "@/components/products/ViewToggle";
import { MobileFilterSortBar } from "@/components/products/MobileFilterSortBar";
import { notFound } from "next/navigation";
import type { CategoryFacet } from "@/components/products/FilterPanel";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import { buildPageMetadata, buildCategoryKeywords } from "@/lib/seo";
import { getServerLang } from "@/lib/serverLocale";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
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

function buildCategoryProductsParams(
  searchParams: CategorySearchParams
): Record<string, RequestParamValue> {
  const params: Record<string, RequestParamValue> = {};

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "view" || key === "page") return;
    if (value === undefined) return;
    if (Array.isArray(value)) {
      params[key] = value.filter((item) => item.trim() !== "");
      return;
    }
    if (value !== "") {
      params[key] = value;
    }
  });

  return params;
}

async function getCategory(slug: string) {
  try {
    const response = await apiFetch<Category>(`/catalog/categories/${slug}/`, {
      headers: await getServerLocaleHeaders(),
      next: { revalidate: 300 }
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
      params: buildCategoryProductsParams(searchParams),
      headers: await getServerLocaleHeaders(),
      next: { revalidate: 300 }
    }
  );
  return response;
}

function buildFilterScopeParams(
  searchParams: CategorySearchParams
): Record<string, string> {
  const params: Record<string, string> = {};
  // Non-price filter params that scope the available options
  for (const key of ["q", "in_stock", "on_sale", "min_rating", "new_arrivals"]) {
    const val = firstValue(searchParams[key]);
    if (val) params[key] = val;
  }
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key.startsWith("attr_")) {
      const val = firstValue(value);
      if (val) params[key] = val;
    }
  });
  return params;
}

async function getFilters(slug: string, searchParams: CategorySearchParams) {
  const params: Record<string, string> = { category: slug, ...buildFilterScopeParams(searchParams) };
  const response = await apiFetch<ProductFilterResponse>("/catalog/products/filters/", {
    params,
    headers: await getServerLocaleHeaders(),
    next: { revalidate: 300 },
  });
  return response.data;
}

async function getCategoryFacets(slug: string, searchParams: CategorySearchParams) {
  const params = buildCategoryProductsParams(searchParams);
  const response = await apiFetch<CategoryFacet[]>(
    `/catalog/categories/${slug}/facets/`,
    { 
      params,
      headers: await getServerLocaleHeaders(),
      next: { revalidate: 300 }
    }
  );
  return response.data;
}

export async function buildCategoryMetadataForPath(
  slugPath: string,
  resolvedSearchParams: CategorySearchParams
): Promise<Metadata> {
  const [category, lang] = await Promise.all([getCategory(slugPath), getServerLang()]);
  const hasFilters = hasIndexBustingFilters(resolvedSearchParams);
  const basePath = buildCategoryPath(slugPath);
  const categoryKeywords = buildCategoryKeywords(category, lang);
  const metadata = buildPageMetadata({
    title: category.meta_title || category.name,
    description:
      category.meta_description ||
      category.description ||
      `Browse ${category.name} products on Bunoraa.`,
    path: basePath,
    keywords: categoryKeywords,
    lang,
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

export async function renderCategoryPageForPath(
  slugPath: string,
  resolvedSearchParams: CategorySearchParams
) {
  const rawCols = resolvedSearchParams.cols;
  const cols: number = (rawCols === "1" || rawCols === "2" || rawCols === "4" || rawCols === "6") ? Number(rawCols) : 4;
  const filterParams: Record<string, string> = { category: slugPath, ...buildFilterScopeParams(resolvedSearchParams) };

  const [category, productsResponse, filterData, facets] = await Promise.all([
    getCategory(slugPath),
    getCategoryProducts(slugPath, resolvedSearchParams),
    getFilters(slugPath, resolvedSearchParams).catch(() => null),
    getCategoryFacets(slugPath, resolvedSearchParams).catch(() => []),
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
    page: 1,
    page_size: products.length,
    total_pages: rawData && (rawData as Record<string, unknown>).count
      ? Math.max(1, Math.ceil(((rawData as Record<string, unknown>).count as number) / Math.max(products.length, 1)))
      : 1,
  } : undefined);

  const totalCount = pagination?.count ?? products.length;
  const showFilters = Boolean(filterData || facets.length || childCategories.length || totalCount > 0);
  const requestParams = buildCategoryProductsParams(resolvedSearchParams);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    ...slugPath.split("/").map((part, idx, arr) => {
      const currentPath = arr.slice(0, idx + 1).join("/");
      return {
        name: part.split("-").join(" "),
        url: buildCategoryPath(currentPath)
      };
    })
  ];

  return (
    <FilterSidebarProvider>
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="mx-auto w-full max-w-[1920px] px-4 py-6 sm:px-6 lg:py-10">
        {/* Header Section */}
        <div className="mb-10 space-y-6">
          <Breadcrumbs items={breadcrumbItems} />
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-3">
              <h1 className="text-3xl uppercase tracking-[0.1em] font-normal text-foreground sm:text-4xl lg:text-5xl mb-4">
                {category.name}
              </h1>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />
                  {totalCount} Curated Pieces
                </div>
                <div className="h-px flex-1 max-w-[100px] bg-border/60" />
              </div>
            </div>

            {/* Mobile Actions Bar - Now below heading */}
            {showFilters && (
              <MobileFilterSortBar
                filters={filterData}
                facets={facets}
                categories={childCategories}
                productCount={totalCount}
                currentCategoryPath={slugPath}
                className="mt-6"
              />
            )}

            {/* Desktop Actions Bar */}
            <div className="hidden lg:flex lg:items-center lg:gap-3">
              {showFilters && (
                <FilterSidebarToggle className="border border-border/60 hover:border-primary/40" />
              )}
              <SortMenu className="h-11 min-w-[180px] rounded-xl border border-border/60 hover:border-primary/40" />
              <ViewToggle className="h-11 border border-border/60 hover:border-primary/40" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className={cn("grid gap-6", showFilters ? "lg:grid-cols-[auto_1fr]" : "grid-cols-1")}>
          {showFilters && (
            <FilterSidebar>
              <FilterPanel
                filters={filterData}
                facets={facets}
                categories={childCategories}
                productCount={totalCount}
                currentCategoryPath={slugPath}
              />
            </FilterSidebar>
          )}

          <main className="space-y-8">
            <AppliedFilters />
            
            <div className="relative -mx-4 sm:-mx-6 lg:mx-0">
              {totalCount === 0 && !hasIndexBustingFilters(resolvedSearchParams) ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-lg font-semibold text-foreground/80">Coming soon</p>
                  <p className="mt-2 text-sm text-foreground/60">This category has no products yet. Check back later or browse other categories.</p>
                  <Link href="/products/" className="mt-6 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                    Browse all products
                  </Link>
                </div>
              ) : totalCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-sm text-foreground/60">No products match your filters.</p>
                </div>
              ) : (
              <InfiniteProductGrid
                endpoint={`/catalog/categories/${slugPath}/products/`}
                requestParams={requestParams}
                initialProducts={products}
                initialPagination={pagination}
                resetKey={JSON.stringify({ endpoint: slugPath, params: requestParams, cols })}
                cols={cols}
                cardStyle="fashion"
                className="min-h-[400px]"
              />
              )}
            </div>

          </main>
        </div>

        {category.description && (
          <div className="mt-20 border-t border-border/40 pt-16 pb-8 bg-muted/30 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-3xl">
            <div className="mx-auto max-w-3xl space-y-8">
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
      </div>
    </div>
    </FilterSidebarProvider>
  );
}
