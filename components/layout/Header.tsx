import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { MenuPage } from "@/lib/types";
import { HeaderClient } from "@/components/layout/HeaderClient";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import { SearchBar } from "@/components/search/SearchBar";
import { MobileNavWrapper } from "@/components/layout/MobileNavWrapper";
import { MobileHeaderVisibility } from "@/components/layout/MobileHeaderVisibility";
import { TranslatedHeaderLink } from "@/components/layout/TranslatedHeaderLink";
import { asArray } from "@/lib/array";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { hasPublishedBundles } from "@/lib/bundles";
import { getSiteSettings } from "@/lib/siteSettings.server";

type Category = { id: string; name: string; slug: string; slug_path?: string | null };

async function getMenuPages() {
  try {
    const response = await apiFetch<MenuPage[]>("/pages/menu/", {
      next: { revalidate: 300 },
    });
    return asArray<MenuPage>(response.data);
  } catch {
    return [];
  }
}

async function getTopCategories() {
  try {
    const response = await apiFetch<Category[]>("/catalog/categories/", {
      params: { page_size: 8, has_products: true },
      next: { revalidate: 300 },
    });
    return asArray<Category>(response.data);
  } catch {
    return [];
  }
}

export async function Header() {
  const [menuResult, categoryResult, bundleAvailabilityResult, siteSettingsResult] =
    await Promise.allSettled([
    getMenuPages(),
    getTopCategories(),
    hasPublishedBundles(),
    getSiteSettings(),
  ]);
  const menuPages = menuResult.status === "fulfilled" ? menuResult.value : [];
  const categories = categoryResult.status === "fulfilled" ? categoryResult.value : [];
  const hasBundles =
    bundleAvailabilityResult.status === "fulfilled"
      ? bundleAvailabilityResult.value
      : false;
  const siteSettings = siteSettingsResult.status === "fulfilled" ? siteSettingsResult.value : null;
  const brandName = siteSettings?.site_name?.trim() || "Bunoraa";
  const faviconUrl = siteSettings?.favicon?.trim() || "/icon.png";

  return (
    <MobileHeaderVisibility>
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/88">
        <div className="mx-auto w-full max-w-[1920px] px-3 py-4 sm:px-5">
          {/* Mobile layout (grid) */}
          <div className="grid grid-cols-3 items-center lg:hidden">
            <MobileNavWrapper
              categories={categories}
              menuPages={menuPages}
              hasBundles={hasBundles}
            />
            <div className="justify-self-center">
              <HeaderBrand
                defaultBrandName={brandName}
                defaultFaviconUrl={faviconUrl}
                fallbackStaticFaviconUrl="/favicon.ico"
              />
            </div>
            <div className="justify-self-end">
              <HeaderClient />
            </div>
          </div>

          {/* Desktop layout (flex) — MobileNavWrapper omitted (its trigger is lg:hidden) */}
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <div className="flex min-w-0 items-center gap-6">
              <HeaderBrand
                defaultBrandName={brandName}
                defaultFaviconUrl={faviconUrl}
                fallbackStaticFaviconUrl="/favicon.ico"
              />
              <nav className="flex items-center gap-4 text-sm">
                <div className="w-48">
                  <SearchBar hideSubmitButtonOnDesktop />
                </div>
                <TranslatedHeaderLink
                  href="/preorders/"
                  className="group relative inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary hover:text-white hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  labelKey="Preorders"
                  badgeKey="New"
                />
                {categories.slice(0, 4).map((category) => (
                  <Link
                    key={category.id}
                    className="text-foreground/70 hover:text-foreground"
                    href={buildCategoryPath(category.slug_path || category.slug)}
                    prefetch={false}
                  >
                    {category.name}
                  </Link>
                ))}
                {menuPages.slice(0, 3).map((page) => (
                  <Link
                    key={page.id}
                    className="text-foreground/70 hover:text-foreground"
                    href={`/pages/${page.slug}/`}
                    prefetch={false}
                  >
                    {page.title}
                  </Link>
                ))}
              </nav>
            </div>
            <HeaderClient />
          </div>
        </div>
      </header>
    </MobileHeaderVisibility>
  );
}
