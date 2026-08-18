import Link from "next/link";
import { ChevronRight, Mail, MapPinHouse, PhoneCall } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type {
  Category,
  ContactSettings,
  MenuPage,
  SiteSettings,
  SocialLink,
} from "@/lib/types";
import { FooterNewsletter } from "@/components/layout/FooterNewsletter";
import { FooterPreferencesDialog } from "@/components/layout/FooterPreferencesDialog";
import { MobileAccordion } from "@/components/layout/MobileAccordion";
import { SocialIcon } from "@/components/layout/SocialIcon";
import { asArray } from "@/lib/array";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { hasPublishedBundles } from "@/lib/bundles";
import { hasPublishedCollections } from "@/lib/collections";
import { hasPublishedArtisans } from "@/lib/artisans";
import { getSiteSettings } from "@/lib/siteSettings.server";

const FOOTER_CATEGORY_LIMIT = 5;

async function getFooterPages() {
  try {
    const response = await apiFetch<MenuPage[]>("/cms/footer/", {
      next: { revalidate: 300 },
    });
    return asArray<MenuPage>(response.data);
  } catch {
    return [];
  }
}

async function getPublishedPages() {
  try {
    const response = await apiFetch<MenuPage[]>("/cms/", {
      next: { revalidate: 300 },
    });
    return asArray<MenuPage>(response.data);
  } catch {
    return [];
  }
}

async function getContactSettings() {
  try {
    const response = await apiFetch<ContactSettings>("/contacts/settings/", {
      next: { revalidate: 300 },
    });
    return response.data;
  } catch {
    return null;
  }
}

async function getTopCategories() {
  try {
    const response = await apiFetch<Category[]>("/catalog/categories/", {
      // Request one extra so we can decide whether to show "Browse all categories".
      params: { page_size: FOOTER_CATEGORY_LIMIT + 1, has_products: true },
      next: { revalidate: 300 },
    });
    return asArray<Category>(response.data);
  } catch {
    return [];
  }
}

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  pinterest: "Pinterest",
};

const SOCIAL_SITE_FIELDS: Array<{ key: keyof SiteSettings; label: string }> = [
  { key: "facebook_url", label: "Facebook" },
  { key: "instagram_url", label: "Instagram" },
  { key: "twitter_url", label: "Twitter" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "youtube_url", label: "YouTube" },
  { key: "tiktok_url", label: "TikTok" },
];

const pickText = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return "";
};

type FooterSocialLink = SocialLink & {
  platform: string;
  icon?: string | null;
  name?: string | null;
};

type FooterLinkItem = {
  key: string;
  label: string;
  href: string;
  isCta?: boolean;
};

type ContactItem = {
  key: string;
  label: string;
  value: string;
  href?: string;
  kind: "email" | "phone" | "address";
};

function hasHref<T extends { href?: string | null }>(item: T): item is T & { href: string } {
  return typeof item.href === "string" && item.href.trim().length > 0;
}

const normalizeSlug = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeHref = (href?: string | null) =>
  String(href || "").trim().toLowerCase().replace(/\/+$/, "");

const normalizeSocialPlatform = (value?: string | null) => {
  const normalized = normalizeSlug(value).replace(/-url$/, "");
  if (normalized === "x") return "twitter";
  return normalized;
};

const dedupeLinks = <T extends FooterLinkItem>(items: T[]) => {
  const seenHref = new Set<string>();
  const seenLabel = new Set<string>();
  return items.filter((item) => {
    const hrefKey = normalizeHref(item.href);
    const labelKey = normalizeSlug(item.label);
    if (!hrefKey || !labelKey) return false;
    if (seenHref.has(hrefKey) || seenLabel.has(labelKey)) {
      return false;
    }
    seenHref.add(hrefKey);
    seenLabel.add(labelKey);
    return true;
  });
};

const dedupeSocialLinks = (items: FooterSocialLink[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export async function Footer() {
  const [
    pagesResult,
    publishedPagesResult,
    siteSettingsResult,
    contactSettingsResult,
    categoriesResult,
    bundleAvailabilityResult,
    collectionsResult,
    artisansResult,
  ] = await Promise.allSettled([
    getFooterPages(),
    getPublishedPages(),
    getSiteSettings(),
    getContactSettings(),
    getTopCategories(),
    hasPublishedBundles(),
    hasPublishedCollections(),
    hasPublishedArtisans(),
  ]);

  const pages = pagesResult.status === "fulfilled" ? pagesResult.value : [];
  const publishedPages =
    publishedPagesResult.status === "fulfilled" ? publishedPagesResult.value : [];
  const siteSettings = siteSettingsResult.status === "fulfilled" ? siteSettingsResult.value : null;
  const contactSettings =
    contactSettingsResult.status === "fulfilled" ? contactSettingsResult.value : null;
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const hasBundles =
    bundleAvailabilityResult.status === "fulfilled"
      ? bundleAvailabilityResult.value
      : false;
  const hasCollections =
    collectionsResult.status === "fulfilled" ? collectionsResult.value : false;
  const hasArtisans =
    artisansResult.status === "fulfilled" ? artisansResult.value : false;

  const brandName = pickText(siteSettings?.company_name, siteSettings?.site_name) || "Bunoraa";
  const brandDescription =
    pickText(
      siteSettings?.footer_text,
      siteSettings?.site_description,
      siteSettings?.tagline,
      siteSettings?.site_tagline
    ) ||
    "Curated fashion, home essentials & artisan goods — ethically sourced and delivered across Bangladesh.";
  const brandSlogan = pickText(siteSettings?.brand_slogan);
  const brandStoryShort = pickText(siteSettings?.brand_story_short);

  const emailItems = [
    {
      label: "Support",
      value: pickText(siteSettings?.support_email, siteSettings?.contact_email),
    },
  ].filter((item) => item.value);

  const phone = pickText(siteSettings?.contact_phone);
  const address = pickText(siteSettings?.address, siteSettings?.contact_address);

  const contactSocialLinks: FooterSocialLink[] = contactSettings?.social_links
    ? Object.entries(contactSettings.social_links)
        .filter(([, url]) => url && String(url).trim())
        .map(([key, url]) => {
          const platform = normalizeSocialPlatform(key);
          return {
            platform,
            label: SOCIAL_LABELS[platform] || key.replace(/_/g, " "),
            url: String(url),
          };
        })
    : [];

  const siteSocialLinks: FooterSocialLink[] = siteSettings
    ? [
        ...(Array.isArray(siteSettings.social_links)
          ? siteSettings.social_links
              .filter((link) => link?.url && String(link.url).trim())
              .map((link) => {
                const platform = normalizeSocialPlatform(link.label || link.name || "");
                return {
                  platform,
                  label:
                    pickText(link.label, link.name) ||
                    SOCIAL_LABELS[platform] ||
                    "Social",
                  url: String(link.url),
                  icon: link.icon || undefined,
                };
              })
          : []),
        ...SOCIAL_SITE_FIELDS.map((field) => {
          const platform = normalizeSocialPlatform(String(field.key).replace(/_url$/, ""));
          return {
            platform,
            label: field.label,
            url: pickText(siteSettings[field.key] as string | null | undefined),
          };
        }).filter((item) => item.url),
      ]
    : [];

  const socialLinks = dedupeSocialLinks(
    contactSocialLinks.length ? contactSocialLinks : siteSocialLinks
  );
  const copyrightText =
    pickText(siteSettings?.copyright_text) || `${brandName}. All rights reserved.`;
  const pageHrefBySlug = new Map(
    publishedPages.map((page) => [normalizeSlug(page.slug), `/pages/${page.slug}/`])
  );
  pages.forEach((page) => {
    pageHrefBySlug.set(normalizeSlug(page.slug), pickText(page.url) || `/pages/${page.slug}/`);
  });
  function resolveFooterPageHref(candidates: string[], fallback: string): string;
  function resolveFooterPageHref(candidates: string[], fallback?: string): string | null;
  function resolveFooterPageHref(candidates: string[], fallback?: string) {
    for (const candidate of candidates) {
      const href = pageHrefBySlug.get(normalizeSlug(candidate));
      if (href) return href;
    }
    return fallback ?? null;
  }
  const footerLegalLinks = dedupeLinks([
    {
      key: "terms",
      label: "Terms of Use",
      href: resolveFooterPageHref(["terms-of-use", "terms", "terms-and-conditions"]) || "/pages/terms/",
    },
    {
      key: "privacy",
      label: "Privacy",
      href: resolveFooterPageHref(["privacy", "privacy-policy"]) || "/pages/privacy/",
    },
    {
      key: "shipping",
      label: "Shipping",
      href: resolveFooterPageHref(["shipping", "shipping-policy"]) || "/pages/shipping/",
    },
    {
      key: "returns",
      label: "Returns",
      href: resolveFooterPageHref(["returns", "returns-policy", "refund-policy"]) || "/pages/returns/",
    },
  ]
    .filter(hasHref));
  const footerLegalHrefSet = new Set(
    footerLegalLinks.map((item) => normalizeHref(item.href))
  );
  const reservedCompanySlugs = new Set([
    "terms-of-use",
    "terms",
    "terms-and-conditions",
    "privacy",
    "privacy-policy",
    "contact",
    "shipping",
    "shipping-policy",
    "returns",
    "returns-policy",
    "refund-policy",
  ]);
  const hasMoreCategories = categories.length > FOOTER_CATEGORY_LIMIT;
  const shopLinks = dedupeLinks(
    categories.length
      ? [
          ...categories.slice(0, FOOTER_CATEGORY_LIMIT).map((category) => ({
            key: `category-${category.id}`,
            label: category.name,
            href: buildCategoryPath(category.slug_path || category.slug),
            isCta: false,
          })),
          ...(hasMoreCategories
            ? [
                {
                  key: "browse-all-categories",
                  label: "Browse all categories",
                  href: "/categories/",
                  isCta: true,
                },
              ]
            : []),
        ]
      : [
          {
            key: "browse-all-categories",
            label: "Browse all categories",
            href: "/categories/",
            isCta: true,
          },
          { key: "all-products", label: "All products", href: "/products/", isCta: false },
        ]
  );
  const shopHrefSet = new Set(shopLinks.map((item) => normalizeHref(item.href)));

  const collectionLinks = dedupeLinks([
    ...(hasCollections
      ? [{ key: "all-collections", label: "All collections", href: "/collections/" }]
      : []),
    { key: "collections-all-products", label: "All products", href: "/products/" },
    ...(hasBundles
      ? [{ key: "collections-bundles", label: "Bundles", href: "/bundles/" }]
      : []),
    ...(hasArtisans
      ? [{ key: "collections-artisans", label: "Artisans", href: "/artisans/" }]
      : []),
    { key: "collections-preorders", label: "Preorders", href: "/preorders/" },
  ])
    .filter((item) => !shopHrefSet.has(normalizeHref(item.href)))
    .filter((item) => {
      if (item.key.startsWith("category-")) return true;
      return true;
    });
  const collectionHrefSet = new Set(collectionLinks.map((item) => normalizeHref(item.href)));
  const blockedCompanyHrefSet = new Set([
    ...footerLegalHrefSet,
    ...shopHrefSet,
    ...collectionHrefSet,
  ]);
  const companyPrimaryLinks = dedupeLinks([
    {
      key: "blog",
      label: "Blog",
      href: "/blog/",
    },
    {
      key: "about",
      label: "About us",
      href: resolveFooterPageHref(["about-bunoraa", "about"], "/about/"),
    },
    {
      key: "faq",
      label: "FAQ",
      href: resolveFooterPageHref(["faq", "faqs"], "/faq/"),
    },
    {
      key: "contact",
      label: "Contact",
      href: "/contact/",
    },
    {
      key: "shipping",
      label: "Shipping",
      href: resolveFooterPageHref(["shipping", "shipping-policy"]),
    },
    {
      key: "returns",
      label: "Returns",
      href: resolveFooterPageHref(["returns", "returns-policy", "refund-policy"]),
    },
  ].filter(hasHref))
    .filter((item) => {
    const hrefKey = normalizeHref(item.href);
    return !blockedCompanyHrefSet.has(hrefKey);
  });
  const companyPrimaryHrefSet = new Set(
    companyPrimaryLinks.map((item) => normalizeHref(item.href))
  );
  const companySupplementalLinks = dedupeLinks(
    pages
      .filter((page) => !reservedCompanySlugs.has(normalizeSlug(page.slug)))
      .map((page) => ({
        key: `company-page-${page.id}`,
        label: page.title,
        href: pickText(page.url) || `/pages/${page.slug}/`,
      }))
      .filter((item) => item.label && item.href)
  ).filter((item) => {
    const hrefKey = normalizeHref(item.href);
    return !blockedCompanyHrefSet.has(hrefKey) && !companyPrimaryHrefSet.has(hrefKey);
  });
  const companySupportLinks = [...companyPrimaryLinks, ...companySupplementalLinks].slice(0, 6);

  const contactItems = [
    ...emailItems.map((item) => ({
      key: `email-${item.label}`,
      label: item.label,
      value: item.value,
      href: `mailto:${item.value}`,
      kind: "email" as const,
    })),
    ...(phone
      ? [
          {
            key: "phone",
            label: "Phone",
            value: phone,
            href: `tel:${phone}`,
            kind: "phone" as const,
          },
        ]
      : []),
    ...(address
      ? [
          {
            key: "address",
            label: "",
            value: address,
            href: "",
            kind: "address" as const,
          },
        ]
      : []),
  ] as ContactItem[];

  const contactIconMap = {
    email: Mail,
    phone: PhoneCall,
    address: MapPinHouse,
  } as const;
  const contactIconContainerClass =
    "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground";
  const contactIconSize = 18;
  const contactIconStroke = 1.9;

  const footerAccordionClass =
    "group rounded-xl border border-border bg-background/40";
  const footerSummaryClass =
    "flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground/90 [&::-webkit-details-marker]:hidden";
  const footerListClass = "space-y-2 border-t border-border px-4 pb-4 pt-3 text-sm text-muted-foreground";
  const footerListLinkClass = "transition-colors hover:text-foreground";
  const shopBrowseAllCtaClass =
    "inline-flex items-center rounded-md border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-muted hover:text-foreground";
  const socialIconLinkClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:border-foreground/40 hover:text-foreground";

  return (
    <footer id="footer" className="mt-auto border-t border-border/80 bg-card pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-content px-[var(--page-gutter)] pb-6 pt-10 sm:pb-8 sm:pt-14">
        <div className="space-y-6 lg:hidden">
          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {brandName}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{brandDescription}</p>
              {brandSlogan ? <p className="mt-2 text-sm font-semibold italic text-foreground/85">{brandSlogan}</p> : null}
              {brandStoryShort ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{brandStoryShort}</p> : null}
            </div>
            <FooterNewsletter />
          </div>

          <MobileAccordion
            footerAccordionClass={footerAccordionClass}
            footerSummaryClass={footerSummaryClass}
            footerListClass={footerListClass}
            footerListLinkClass={footerListLinkClass}
            shopBrowseAllCtaClass={shopBrowseAllCtaClass}
            socialIconLinkClass={socialIconLinkClass}
            shopLinks={shopLinks}
            collectionLinks={collectionLinks}
            companySupportLinks={companySupportLinks}
            contactItems={contactItems}
            socialLinks={socialLinks}
            contactIconSize={contactIconSize}
            contactIconStroke={contactIconStroke}
            contactIconContainerClass={contactIconContainerClass}
          />
        </div>

        <div className="hidden gap-8 sm:grid-cols-2 lg:grid lg:grid-cols-6">
          <div className="space-y-4 sm:col-span-2 lg:col-span-2">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                {brandName}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{brandDescription}</p>
              {brandSlogan ? <p className="mt-2 text-sm font-semibold italic text-foreground/85">{brandSlogan}</p> : null}
              {brandStoryShort ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{brandStoryShort}</p> : null}
            </div>
            <FooterNewsletter />
          </div>

          <div>
            <p className="text-sm font-semibold">Shop</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {shopLinks.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={
                      item.isCta ? `${shopBrowseAllCtaClass} group` : footerListLinkClass
                    }
                    >
                      <span>{item.label}</span>
                      {item.isCta ? (
                        <ChevronRight
                          aria-hidden="true"
                          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                          strokeWidth={1.8}
                        />
                      ) : null}
                    </Link>
                  </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Collections</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {collectionLinks.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={footerListLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Company & Support</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {companySupportLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={footerListLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Contact & Location</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {contactItems.map((item) => {
                const Icon = contactIconMap[item.kind];
                return (
                  <li key={item.key} className="flex items-start gap-2">
                    <span
                      className={contactIconContainerClass}
                      aria-hidden="true"
                    >
                      <Icon
                        size={contactIconSize}
                        strokeWidth={contactIconStroke}
                      />
                    </span>
                    <span className="sr-only">
                      {item.label || item.kind}
                    </span>
                    {item.href ? (
                      <Link href={item.href}>{item.value}</Link>
                    ) : (
                      <span>{item.value}</span>
                    )}
                  </li>
                );
              })}
              {socialLinks.length ? (
                <li className="pt-1">
                  <div className="flex items-center gap-2">
                    {socialLinks.map((link) => (
                      <Link
                        key={`desktop-social-${link.platform}-${link.url}`}
                        href={link.url}
                        className={socialIconLinkClass}
                        aria-label={link.label}
                        title={link.label}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <SocialIcon platform={link.platform} iconUrl={link.icon} />
                      </Link>
                    ))}
                  </div>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div
          className="mt-8 border-t border-border pt-4"
          style={{
            paddingBottom:
              "max(var(--mobile-sticky-footer-clearance, 0.2rem), env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FooterPreferencesDialog />
            <p className="text-center text-xs leading-normal text-muted-foreground lg:text-left">
              &copy; {new Date().getFullYear()} {copyrightText}
            </p>
            {footerLegalLinks.length ? (
              <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:justify-end">
                {footerLegalLinks.map((item) => (
                  <li key={item.key}>
                    <Link href={item.href} className="hover:text-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
