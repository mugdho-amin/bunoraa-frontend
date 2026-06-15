import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import { getServerLocaleHeaders, getServerLang } from "@/lib/serverLocale";
import type { Collection, ProductListItem } from "@/lib/types";
import { asArray } from "@/lib/array";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/siteSettings.server";
import type { HeroBanner } from "@/components/promotions/HeroBannerSlider";
import { HomePageContent } from "@/components/home/HomePageContent";

type Banner = HeroBanner & { position?: string | null };
type FeaturedCategory = { id: string; name: string; slug: string; slug_path?: string | null; image?: string | null; icon?: string | null; product_count?: number | null; is_featured?: boolean | null; };
type Spotlight = { id: string; name?: string; placement?: string; product?: ProductListItem | null; category?: FeaturedCategory | null; };
type CategoryBandData = { category: FeaturedCategory; products: ProductListItem[]; };
type HomepageData = { featured_products: ProductListItem[]; new_arrivals: ProductListItem[]; bestsellers: ProductListItem[]; on_sale: ProductListItem[]; featured_categories: FeaturedCategory[]; category_bands?: CategoryBandData[]; collections: Collection[]; spotlights?: Spotlight[]; show_by_categories?: FeaturedCategory[]; };

const HOME_KEYWORDS = ["Bunoraa", "hand-embroidered fashion Bangladesh", "artisan collections Bangladesh", "ethically sourced clothing", "Bangladeshi artisan market", "handmade home decor Bangladesh", "traditional embroidery Bangladesh", "buy artisan products online Bangladesh", "Bangladesh fashion marketplace", "handcrafted gifts Bangladesh", "embroidered cotton dresses Bangladesh", "artisan home essentials Bangladesh", "nakshi kantha embroidery", "hand embroidered kurta Bangladesh", "Eid clothing Bangladesh", "Bangladeshi fashion online", "handmade co-ord sets", "artisan cushion covers Dhaka", "traditional Bangladeshi clothing", "hand embroidered shalwar kameez", "buy nakshi kantha online", "Bangladeshi artisan gifts", "hand embroidered fatua", "sustainable fashion Bangladesh", "handmade kids clothing Bangladesh", "Bangladeshi home decor online", "custom embroidered clothing", "festive wear Bangladesh", "hand embroidered cotton dress", "Bangladeshi women fashion online"];

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return buildPageMetadata({ title: "Curated Products and Artisan Collections | Bunoraa", description: "Discover ethically sourced hand-embroidered fashion, home decor, and artisan collections. Delivered across Bangladesh.", path: "/", keywords: HOME_KEYWORDS, lang });
}

const DEFAULT_HOMEPAGE_DATA: HomepageData = { featured_products: [], new_arrivals: [], bestsellers: [], on_sale: [], featured_categories: [], category_bands: [], collections: [], spotlights: [], show_by_categories: [] };

async function getHomepageData() {
  try {
    let headers = {};
    try { headers = await getServerLocaleHeaders(); } catch { }
    const response = await apiFetch<HomepageData>("/catalog/homepage/", { headers });
    const payload = response.data && typeof response.data === "object" && !Array.isArray(response.data) ? response.data : {};
    return { ...DEFAULT_HOMEPAGE_DATA, ...payload, featured_products: asArray<ProductListItem>((payload as HomepageData).featured_products), new_arrivals: asArray<ProductListItem>((payload as HomepageData).new_arrivals), bestsellers: asArray<ProductListItem>((payload as HomepageData).bestsellers), on_sale: asArray<ProductListItem>((payload as HomepageData).on_sale), featured_categories: asArray<FeaturedCategory>((payload as HomepageData).featured_categories), category_bands: asArray<CategoryBandData>((payload as HomepageData).category_bands), collections: asArray<Collection>((payload as HomepageData).collections), spotlights: asArray<Spotlight>((payload as HomepageData).spotlights), show_by_categories: asArray<FeaturedCategory>((payload as HomepageData).show_by_categories) };
  } catch (error: unknown) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 503)) return DEFAULT_HOMEPAGE_DATA;
    console.error("Failed to fetch homepage data:", error instanceof Error ? error.message : error);
    return DEFAULT_HOMEPAGE_DATA;
  }
}

async function getBanners(position?: string) {
  try {
    let headers = {};
    try { headers = await getServerLocaleHeaders(); } catch { }
    const response = await apiFetch<Banner[]>("/promotions/banners/", { params: position ? { position } : undefined, headers });
    return asArray<Banner>(response.data);
  } catch (error: unknown) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 503)) return [] as Banner[];
    console.error(`Failed to fetch banners for position ${position}:`, error instanceof Error ? error.message : error);
    return [] as Banner[];
  }
}

export default async function Home() {
  const [heroBanners, siteSettings, homepageData] = await Promise.all([
    getBanners("home_hero").catch(() => [] as Banner[]),
    getSiteSettings().catch(() => null),
    getHomepageData().catch(() => null),
  ]);

  return <HomePageContent heroBanners={heroBanners} siteSettings={siteSettings} homepageData={homepageData} />;
}
