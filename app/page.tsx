import type { Metadata } from "next";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getServerLocaleHeaders } from "@/lib/serverLocale";
import type {
  Collection,
  ProductListItem,
} from "@/lib/types";
import { asArray } from "@/lib/array";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, buildItemList, buildPageMetadata, cleanObject } from "@/lib/seo";
import { buildProductPath } from "@/lib/productPaths";
import { getSiteSettings } from "@/lib/siteSettings.server";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import { CategoryBand } from "@/components/products/CategoryBand";

const ProductGrid = dynamicImport(
  () => import("@/components/products/ProductGrid").then((mod) => mod.ProductGrid)
);
const RecentlyViewedSection = dynamicImport(
  () => import("@/components/products/RecentlyViewedSection").then((mod) => mod.RecentlyViewedSection)
);
const HomeProductTabs = dynamicImport(
  () => import("@/components/products/HomeProductTabs").then((mod) => mod.HomeProductTabs)
);
const HeroBannerSlider = dynamicImport(
  () => import("@/components/promotions/HeroBannerSlider").then((mod) => mod.HeroBannerSlider)
);
import type { HeroBanner } from "@/components/promotions/HeroBannerSlider";

export const metadata: Metadata = buildPageMetadata({
  title: "Curated Products and Artisan Collections",
  description:
    "Shop curated products, themed collections, bundles, and custom preorder programs at Bunoraa.",
  path: "/",
});

type FeaturedCategory = {
id: string;
name: string;
slug: string;
slug_path?: string | null;
image?: string | null;
icon?: string | null;
product_count?: number | null;
is_featured?: boolean | null;
};
type Spotlight = {
  id: string;
  name?: string;
  placement?: string;
  product?: ProductListItem | null;
  category?: FeaturedCategory | null;
};

type HomepageData = {
  featured_products: ProductListItem[];
  new_arrivals: ProductListItem[];
  bestsellers: ProductListItem[];
  on_sale: ProductListItem[];
  featured_categories: FeaturedCategory[];
  category_bands?: CategoryBandData[];
  collections: Collection[];
  spotlights?: Spotlight[];
  show_by_categories?: FeaturedCategory[];
};

type Banner = HeroBanner & {
  position?: string | null;
};

type CategoryBandData = {
  category: FeaturedCategory;
  products: ProductListItem[];
};

const DEFAULT_HOMEPAGE_DATA: HomepageData = {
  featured_products: [],
  new_arrivals: [],
  bestsellers: [],
  on_sale: [],
  featured_categories: [],
  category_bands: [],
  collections: [],
  spotlights: [],
  show_by_categories: [],
};

const HOMEPAGE_REVALIDATE_SECONDS = 120;

const pickText = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return "";
};

const getImage = (product: ProductListItem | null | undefined) => {
  if (!product) return null;
  const primary = product.primary_image as unknown as
    | string
    | { image?: string | null }
    | null;
  if (!primary) return null;
  if (typeof primary === "string") return primary;
  return primary.image || null;
};

async function getHomepageData() {
  try {
    let headers = {};
    try {
        headers = await getServerLocaleHeaders();
    } catch {
        // Fallback for static generation where cookies() might not be available
    }
    const response = await apiFetch<HomepageData>("/catalog/homepage/", {
      headers,
      next: { revalidate: HOMEPAGE_REVALIDATE_SECONDS },
    });
    const payload =
      response.data && typeof response.data === "object" && !Array.isArray(response.data)
        ? response.data
        : {};
    return {
      ...DEFAULT_HOMEPAGE_DATA,
      ...payload,
      featured_products: asArray<ProductListItem>((payload as HomepageData).featured_products),
      new_arrivals: asArray<ProductListItem>((payload as HomepageData).new_arrivals),
      bestsellers: asArray<ProductListItem>((payload as HomepageData).bestsellers),
      on_sale: asArray<ProductListItem>((payload as HomepageData).on_sale),
      featured_categories: asArray<FeaturedCategory>(
        (payload as HomepageData).featured_categories
      ),
      category_bands: asArray<CategoryBandData>((payload as HomepageData).category_bands),
      collections: asArray<Collection>((payload as HomepageData).collections),
      spotlights: asArray<Spotlight>((payload as HomepageData).spotlights),
      show_by_categories: asArray<FeaturedCategory>((payload as HomepageData).show_by_categories),
    };
  } catch (error: unknown) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 503)) {
      return DEFAULT_HOMEPAGE_DATA;
    }
    console.error("Failed to fetch homepage data:", error instanceof Error ? error.message : error);
    return DEFAULT_HOMEPAGE_DATA;
  }
}

async function getBanners(position?: string) {
  try {
    let headers = {};
    try {
        headers = await getServerLocaleHeaders();
    } catch {
        // Fallback for static generation where cookies() might not be available
    }
    const response = await apiFetch<Banner[]>("/promotions/banners/", {
      params: position ? { position } : undefined,
      headers,
      next: { revalidate: HOMEPAGE_REVALIDATE_SECONDS },
    });
    return asArray<Banner>(response.data);
  } catch (error: unknown) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 503)) {
      return [] as Banner[];
    }
    console.error(`Failed to fetch banners for position ${position}:`, error instanceof Error ? error.message : error);
    return [] as Banner[];
  }
}

async function CategoryBandsLoader({
  categoryBandsWithProducts,
}: {
  categoryBandsWithProducts: CategoryBandData[];
}) {
  return (
    <>
      {categoryBandsWithProducts.map((band) => (
        <CategoryBand key={band.category.id} band={band} />
      ))}
    </>
  );
}

export default async function Home() {
  const [heroBanners, siteSettings, homepageData] = await Promise.all([
    getBanners("home_hero"),
    getSiteSettings(),
    getHomepageData(),
  ]);

  const featuredProducts = asArray<ProductListItem>(homepageData.featured_products);
  const newArrivals = asArray<ProductListItem>(homepageData.new_arrivals);
  const bestsellers = asArray<ProductListItem>(homepageData.bestsellers);
  const onSale = asArray<ProductListItem>(homepageData.on_sale);
  const featuredCategories = asArray<FeaturedCategory>(homepageData.featured_categories);
  const spotlights = asArray<Spotlight>(homepageData.spotlights);
  const featuredCategoryIds = new Set(featuredCategories.map((c) => c.id));
  
  const resolveCategoryId = (p: ProductListItem) => {
    if (p.primary_category_id && featuredCategoryIds.has(p.primary_category_id)) return p.primary_category_id;
    const pathIds = (p.primary_category_path || "").split("/").filter(Boolean);
    for (let i = pathIds.length - 1; i >= 0; i--) if (featuredCategoryIds.has(pathIds[i])) return pathIds[i];
    return null;
  };
  
  const filterProducts = (products: ProductListItem[]) => products.filter((p) => Boolean(resolveCategoryId(p)));
  const filteredFeaturedProducts = filterProducts(featuredProducts);
  const filteredNewArrivals = filterProducts(newArrivals);
  const filteredBestsellers = filterProducts(bestsellers);
  const filteredOnSale = filterProducts(onSale);
  const categoryBands = asArray<CategoryBandData>(homepageData.category_bands);

  const seenIds = new Set<string>();
  const categoryBandsWithProducts = categoryBands
    .map((b) => ({
      ...b,
      products: b.products.filter((p) => {
        if (!p?.id || resolveCategoryId(p) !== b.category.id || seenIds.has(p.id)) return false;
        seenIds.add(p.id);
        return true;
      }),
    }))
    .filter((b) => b.products.length > 0);

  const collections = asArray<Collection>(homepageData.collections);
  const brandName = pickText(siteSettings?.site_name);
  const heroDescription = pickText(
    siteSettings?.site_tagline,
    siteSettings?.tagline,
    siteSettings?.site_description
  );

  const homePageSchema = cleanObject({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: brandName,
    description: heroDescription,
    url: absoluteUrl("/"),
    isPartOf: {
      "@id": absoluteUrl("/#website"),
    },
  });

  const featuredList = buildItemList(
    filteredFeaturedProducts.slice(0, 10).map((product) => ({
      name: product.name,
      url: buildProductPath(product),
      image: getImage(product) || undefined,
      description: product.short_description || undefined,
    })),
    "Featured products"
  );

  const collectionsList = buildItemList(
    collections.slice(0, 10).map((collection) => ({
      name: collection.name,
      url: `/collections/${collection.slug}/`,
      image: collection.image || undefined,
      description: collection.description || undefined,
    })),
    "Collections"
  );

  const jsonLd = [
    homePageSchema,
    ...(filteredFeaturedProducts.length ? [featuredList] : []),
    ...(collections.length ? [collectionsList] : []),
  ];

  const sectionWrapperClass = "mx-auto w-full max-w-7xl px-3 sm:px-5";

  return (
    <div className="bg-background text-foreground">
      <section>
        <div className={`${sectionWrapperClass} pb-6`}>
          {heroBanners.length ? (
            <HeroBannerSlider banners={heroBanners} className="mx-auto" autoAdvance={true} intervalMs={5000} />
          ) : (
            <div className="aspect-[16/7] w-full bg-muted" />
          )}
        </div>
      </section>

      {spotlights.length ? (
        <section className={`${sectionWrapperClass} py-8`}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/70">Spotlights</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spotlights.map((spotlight) => {
              const image = spotlight.product?.primary_image as string;
              return (
                <Link key={spotlight.id} href={spotlight.product ? buildProductPath(spotlight.product) : "/"} className="group overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {image && (
                      <Image 
                        src={image} 
                        alt={spotlight.name || spotlight.product?.name || "Spotlight"} 
                        fill 
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" 
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <Suspense fallback={<SectionSkeleton title="Loading Categories..." />}>
        <CategoryBandsLoader categoryBandsWithProducts={categoryBandsWithProducts} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="Seasonal Favs" />}>
        {filteredOnSale.length ? (
          <section className={`${sectionWrapperClass} py-8`}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/70">Seasonal Favs</h2>
            <div className="mt-4">
              <ProductGrid products={filteredOnSale.slice(0, 8)} cardStyle="minimal" allowQuickView={true} showWishlist={true} />
            </div>
          </section>
        ) : null}
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="Recommended" />}>
        <section className={`${sectionWrapperClass} py-8`}>
          <HomeProductTabs
            newDrops={filteredNewArrivals}
            trending={filteredBestsellers}
            allowQuickView={true}
            showWishlist={true}
          />
        </section>
      </Suspense>

      <section className={`${sectionWrapperClass} py-8`}>
        <RecentlyViewedSection />
      </section>

      <JsonLd data={jsonLd} />
    </div>
  );
}
