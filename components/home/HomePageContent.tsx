import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import dynamicImport from "next/dynamic";
import type { Collection, ProductListItem } from "@/lib/types";
import { asArray } from "@/lib/array";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, buildItemList, buildLocalBusinessSchema, cleanObject } from "@/lib/seo";
import { buildProductPath } from "@/lib/productPaths";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryBand } from "@/components/products/CategoryBand";
import { HeroBannerSlider } from "@/components/promotions/HeroBannerSlider";
import type { HeroBanner } from "@/components/promotions/HeroBannerSlider";

const ProductGrid = dynamicImport(() => import("@/components/products/ProductGrid").then((mod) => mod.ProductGrid));
const RecentlyViewedSection = dynamicImport(() => import("@/components/products/RecentlyViewedSection").then((mod) => mod.RecentlyViewedSection));
const HomeProductTabs = dynamicImport(() => import("@/components/products/HomeProductTabs").then((mod) => mod.HomeProductTabs));

type FeaturedCategory = { id: string; name: string; slug: string; slug_path?: string | null; image?: string | null; icon?: string | null; product_count?: number | null; is_featured?: boolean | null; };
type Spotlight = { id: string; name?: string; placement?: string; product?: ProductListItem | null; category?: FeaturedCategory | null; };
type Banner = HeroBanner & { position?: string | null; };
type CategoryBandData = { category: FeaturedCategory; products: ProductListItem[]; };
type HomepageData = { featured_products: ProductListItem[]; new_arrivals: ProductListItem[]; bestsellers: ProductListItem[]; on_sale: ProductListItem[]; featured_categories: FeaturedCategory[]; category_bands?: CategoryBandData[]; collections: Collection[]; spotlights?: Spotlight[]; show_by_categories?: FeaturedCategory[]; };
type SiteSettings = { site_name?: string | null; site_tagline?: string | null; tagline?: string | null; site_description?: string | null; cover_video_url?: string | null; cover_video_mp4?: string | null; cover_video_webm?: string | null; cover_video_poster?: string | null; brand_slogan?: string | null; brand_story_short?: string | null; } | null;

const pickText = (...values: Array<string | null | undefined>) => { for (const value of values) { if (value && value.trim()) return value.trim(); } return ""; };
const getImage = (product: ProductListItem | null | undefined) => {
  if (!product) return null;
  const primary = product.primary_image as unknown as string | { image?: string | null } | null;
  if (!primary) return null;
  if (typeof primary === "string") return primary;
  return primary.image || null;
};

async function CategoryBandsLoader({ categoryBandsWithProducts }: { categoryBandsWithProducts: CategoryBandData[] }) {
  return <>{categoryBandsWithProducts.map((band) => <CategoryBand key={band.category.id} band={band} />)}</>;
}

export async function HomePageContent({ heroBanners, siteSettings, homepageData }: { heroBanners: Banner[]; siteSettings: SiteSettings; homepageData: HomepageData | null }) {
  const hd = homepageData ?? { featured_products: [], new_arrivals: [], bestsellers: [], on_sale: [], featured_categories: [], spotlights: [], collections: [], category_bands: [] } as HomepageData;
  const featuredProducts = asArray<ProductListItem>(hd.featured_products);
  const newArrivals = asArray<ProductListItem>(hd.new_arrivals);
  const bestsellers = asArray<ProductListItem>(hd.bestsellers);
  const onSale = asArray<ProductListItem>(hd.on_sale);
  const featuredCategories = asArray<FeaturedCategory>(hd.featured_categories);
  const spotlights = asArray<Spotlight>(hd.spotlights);
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
  const categoryBands = asArray<CategoryBandData>(hd.category_bands);

  const seenIds = new Set<string>();
  const categoryBandsWithProducts = categoryBands.map((b) => ({ ...b, products: b.products.filter((p) => { if (!p?.id || resolveCategoryId(p) !== b.category.id || seenIds.has(p.id)) return false; seenIds.add(p.id); return true; }) })).filter((b) => b.products.length > 0);

  const collections = asArray<Collection>(hd.collections);
  const brandName = pickText(siteSettings?.site_name);
  const heroDescription = pickText(siteSettings?.site_tagline, siteSettings?.tagline, siteSettings?.site_description);
  const brandSlogan = pickText(siteSettings?.brand_slogan);
  const brandStoryShort = pickText(siteSettings?.brand_story_short);

  const homePageSchema = cleanObject({ "@context": "https://schema.org", "@type": "WebPage", name: brandName, description: heroDescription, url: absoluteUrl("/"), isPartOf: { "@id": absoluteUrl("/#website") } });
  const featuredList = buildItemList(filteredFeaturedProducts.slice(0, 10).map((product) => ({ name: product.name, url: buildProductPath(product), image: getImage(product) || undefined, description: product.short_description || undefined })), "Featured products");
  const collectionsList = buildItemList(collections.slice(0, 10).map((collection) => ({ name: collection.name, url: `/collections/${collection.slug}/`, image: collection.image || undefined, description: collection.description || undefined })), "Collections");
  const jsonLd = [homePageSchema, buildLocalBusinessSchema(), ...(filteredFeaturedProducts.length ? [featuredList] : []), ...(collections.length ? [collectionsList] : [])];

  const sectionWrapperClass = "page-shell section-pad";

  return (
    <div className="bg-background text-foreground">
      <h1 className="sr-only">Bunoraa: Ethically Sourced Artisan Fashion & Home Decor</h1>

      {/* Hero — full-bleed, mobile-optimized height via HeroBannerSlider */}
      <section aria-label="Featured promotions" className="relative">
        <div className="w-full">
          {heroBanners.length ? (
            <HeroBannerSlider
              banners={heroBanners}
              className="mx-auto"
              autoAdvance={true}
              intervalMs={5000}
            />
          ) : siteSettings?.cover_video_url || siteSettings?.cover_video_mp4 ? (
            <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
              <video
                autoPlay
                muted
                loop
                playsInline
                poster={siteSettings.cover_video_poster || undefined}
                className="h-full w-full object-cover"
              >
                {siteSettings.cover_video_webm && (
                  <source src={siteSettings.cover_video_webm} type="video/webm" />
                )}
                {siteSettings.cover_video_mp4 && (
                  <source src={siteSettings.cover_video_mp4} type="video/mp4" />
                )}
                {siteSettings.cover_video_url && (
                  <source src={siteSettings.cover_video_url} type="video/mp4" />
                )}
              </video>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              <div className="pointer-events-none absolute bottom-8 left-8 right-8 sm:bottom-12 sm:left-12">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg sm:text-4xl">
                  {siteSettings.site_tagline || siteSettings.site_name}
                </h2>
              </div>
            </div>
          ) : (
            <div className="aspect-[16/9] w-full bg-muted sm:aspect-[16/7]" aria-hidden="true" />
          )}
        </div>
      </section>

      {brandSlogan || brandStoryShort ? (
        <section aria-label={brandSlogan || "About Bunoraa"} className="border-b border-border bg-gradient-to-r from-primary/15 via-background to-accent/10">
          <div className="page-shell flex flex-col items-center justify-center gap-1 px-[var(--page-gutter)] py-4 text-center sm:flex-row sm:gap-3 sm:py-3">
            {brandSlogan ? <p className="text-sm font-semibold italic text-foreground sm:text-base">{brandSlogan}</p> : null}
            {brandSlogan && brandStoryShort ? <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">•</span> : null}
            {brandStoryShort ? <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{brandStoryShort}</p> : null}
          </div>
        </section>
      ) : null}

      {/* Spotlights */}
      {spotlights.length ? (
        <section className={sectionWrapperClass} aria-labelledby="spotlights-heading">
          <SectionHeading
            eyebrow="Curated"
            title="Spotlights"
            as="h2"
          />
          <div className="mt-1 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 -mx-[var(--page-gutter)] px-[var(--page-gutter)] lg:mx-0 lg:px-0">
            {spotlights.map((spotlight, idx) => {
              const image = spotlight.product?.primary_image as string;
              const label = spotlight.name || spotlight.product?.name || "Spotlight";
              return (
                <Link
                  key={spotlight.id}
                  href={spotlight.product ? buildProductPath(spotlight.product) : "/"}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {image ? (
                      <Image
                        src={image}
                        alt={label}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
                        priority={idx === 0}
                        loading={idx === 0 ? "eager" : "lazy"}
                        decoding={idx === 0 ? "sync" : "async"}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-80" />
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                      <p className="text-sm font-semibold text-white drop-shadow-sm text-balance sm:text-base">
                        {label}
                      </p>
                    </div>
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

      <Suspense fallback={<SectionSkeleton title="Sale" />}>
        {filteredOnSale.length ? (
          <section className={sectionWrapperClass} aria-label="On sale">
            <SectionHeading
              eyebrow="Limited time"
              href="/products/?on_sale=true"
              linkLabel="Shop sale"
            />
            <div className="-mx-[var(--page-gutter)] px-[var(--page-gutter)] lg:mx-0 lg:px-0">
              <ProductGrid
                products={filteredOnSale.slice(0, 8)}
                cardStyle="minimal"
                allowQuickView={true}
                showWishlist={true}
              />
            </div>
          </section>
        ) : null}
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="Recommended" />}>
        <section className={sectionWrapperClass} aria-label="Recommended products">
          <div className="-mx-[var(--page-gutter)] px-[var(--page-gutter)] lg:mx-0 lg:px-0">
            <HomeProductTabs
              newDrops={filteredNewArrivals}
              trending={filteredBestsellers}
              allowQuickView={true}
              showWishlist={true}
            />
          </div>
        </section>
      </Suspense>

      <section className={sectionWrapperClass} aria-label="Recently viewed">
        <div className="-mx-3 sm:-mx-5 lg:mx-0">
          <RecentlyViewedSection />
        </div>
      </section>

      <JsonLd data={jsonLd} />
    </div>
  );
}
