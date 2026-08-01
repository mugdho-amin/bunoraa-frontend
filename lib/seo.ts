import type { ProductDetail, SiteSettings } from "@/lib/types";
import type { Metadata } from "next";
import { buildProductPath } from "@/lib/productPaths";

type UrlLike = string | null | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set. This is required for SEO metadata generation.`);
  }
  return value.replace(/\/$/, "");
}

export const SITE_URL = requireEnv("NEXT_PUBLIC_SITE_URL");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Bunoraa";
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

/**
 * Get the backend API base URL (without trailing /api/v1)
 * Used for accessing backend-only endpoints like sitemaps
 * @returns Backend base URL (e.g., https://api.bunoraa.com or https://backend.hf.space)
 */
export function getBackendBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set. Required for backend URL construction.");
  }
  // Remove /api/v* suffix if present to get base backend URL
  return apiUrl.replace(/\/api\/v\d+\/?$/, "") || apiUrl;
}

export function absoluteUrl(path: UrlLike): string {
  if (!path) return SITE_URL;
  if (path.startsWith("//")) return `https:${path}`;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!path.startsWith("/")) return `${SITE_URL}/${path}`;
  return `${SITE_URL}${path}`;
}

function normalizePath(path: string): string {
  if (!path) return "/";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      return `${url.pathname}${url.search}` || "/";
    } catch {
      return "/";
    }
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  images,
  keywords,
  type = "website",
  lang,
}: {
  title: string;
  description?: string;
  path: string;
  images?: Array<string | null | undefined>;
  keywords?: string | string[];
  type?: "website" | "article";
  lang?: string;
}): Metadata {
  const canonicalPath = normalizePath(path);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const imageUrls = (images || []).filter(Boolean).map((image) => absoluteUrl(image as string));
  const shareImages = imageUrls.length ? imageUrls : [absoluteUrl(DEFAULT_OG_IMAGE_PATH)];

  const kw = keywords
    ? (Array.isArray(keywords) ? keywords : keywords.split(",").map((k) => k.trim()).filter(Boolean))
    : undefined;

  // Enrich keywords with language-specific clusters
  let enrichedKeywords = kw;
  const langKW = getLanguageKeywords(lang);
  if (langKW.length) {
    enrichedKeywords = kw ? [...kw, ...langKW] : langKW;
  }

  const alternates: Metadata["alternates"] = {
    canonical: canonicalPath,
  };

  if (lang) {
    const langAlternates: Record<string, string> = {
      "x-default": canonicalUrl,
      en: canonicalUrl,
    };
    if (lang !== "en") {
      langAlternates[lang] = canonicalUrl;
    }
    alternates.languages = langAlternates;
  }

  return {
    title,
    ...(description ? { description } : {}),
    keywords: enrichedKeywords,
    alternates,
    openGraph: {
      type,
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      ...(description ? { description } : {}),
      images: shareImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      ...(description ? { description } : {}),
      images: shareImages,
    },
  };
}

export function buildNoIndexMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    ...buildPageMetadata({ title, description, path }),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        "max-snippet": 0,
        "max-image-preview": "none",
        "max-video-preview": 0,
      },
    },
  };
}

export function cleanObject<T extends Record<string, unknown>>(obj: T): T {
  const entries = Object.entries(obj).filter(([, value]) => {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
  return Object.fromEntries(entries) as T;
}

export function buildBreadcrumbList(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) =>
      cleanObject({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.url),
      })
    ),
  };
}

export function buildItemList(
  items: Array<{
    name: string;
    url: string;
    image?: string | null;
    description?: string | null;
  }>,
  listName?: string,
  listId?: string
) {
  return cleanObject({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": listId ? absoluteUrl(listId) : undefined,
    name: listName,
    itemListElement: items.map((item, index) =>
      cleanObject({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(item.url),
        name: item.name,
        image: item.image ? absoluteUrl(item.image) : undefined,
        description: item.description,
      })
    ),
  });
}

export function buildCollectionPage({
  name,
  description,
  url,
  itemListId,
}: {
  name: string;
  description?: string | null;
  url: string;
  itemListId?: string;
}) {
  return cleanObject({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(url),
    mainEntity: itemListId ? { "@id": absoluteUrl(itemListId) } : undefined,
  });
}

export function buildSearchResultsPage({
  name,
  description,
  url,
  itemListId,
}: {
  name: string;
  description?: string | null;
  url: string;
  itemListId?: string;
}) {
  return cleanObject({
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name,
    description,
    url: absoluteUrl(url),
    mainEntity: itemListId ? { "@id": absoluteUrl(itemListId) } : undefined,
  });
}

// =============================================================================
// Keyword engineering — entity-based keyword cluster extraction
// =============================================================================

const TYPO_KEYWORDS = [
  "bunora",
  "bunorah",
  "bunoraa bd",
  "bunora bangladesh",
];

const BENGALI_KEYWORDS = [
  "বুনোরা",
  "নকশি কাঁথা",
  "হাতে তৈরি ফ্যাশন",
  "বাংলাদেশি আর্টিজান মার্কেটপ্লেস",
  "হাতে এমব্রয়ডারি পোশাক",
  "ইদ কালেকশন",
  "পহেলা বৈশাখ",
  "পহেলা ফাল্গুন",
  "বাংলাদেশি ফ্যাশন অনলাইন",
  "ক্যাশ অন ডেলিভারি",
  "ফ্রি ডেলিভারি বাংলাদেশ",
  "হোম ডেকোর বাংলাদেশ",
  "হাতে এমব্রয়ডারি শাড়ি",
  "হাতে এমব্রয়ডারি কুর্তা",
  "আর্টিজান পণ্য বাংলাদেশ",
  "টেকসই ফ্যাশন",
  "বিয়ের কালেকশন",
  "হাতে তৈরি উপহার",
  "নৈতিক ফ্যাশন",
  "বাংলাদেশি হস্তশিল্প",
];

const BENGALI_FESTIVE_KEYWORDS = [
  "ইদুল ফিতর",
  "ইদুল আযহা",
  "পহেলা বৈশাখ",
  "পহেলা ফাল্গুন",
  "দুর্গাপূজা",
  "বিয়ে উপলক্ষে",
];

const BENGALI_CRAFT_KEYWORDS = [
  "হাতে এমব্রয়ডারি",
  "নকশি কাঁথার কাজ",
  "বাংলাদেশি হস্তশিল্প",
  "আর্টিজান পণ্য",
  "ঐতিহ্যবাহী কারুশিল্প",
];

const BENGALI_LOCATIONS = [
  "বাংলাদেশ",
  "ঢাকা",
  "চট্টগ্রাম",
  "রংপুর",
  "কুড়িগ্রাম",
  "সিলেট",
  "খুলনা",
  "রাজশাহী",
  "বরিশাল",
  "ময়মনসিংহ",
];

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "in", "on", "for", "with", "from", "by",
  "to", "of", "at", "is", "it", "this", "that", "these", "those",
]);

const ATTRIBUTE_KEYWORDS: Record<string, string[]> = {
  color: ["color", "shade", "hue", "tone"],
  size: ["size", "fit", "dimension"],
  material: ["material", "fabric", "textile", "cloth"],
  pattern: ["pattern", "design", "print", "motif"],
  occasion: ["occasion", "event", "wear", "festive", "ceremony"],
  style: ["style", "type", "category", "collection"],
  neckline: ["neckline", "collar", "neck"],
  sleeve: ["sleeve", "length"],
  fabric: ["fabric", "textile", "cloth", "material", "weave"],
  craft: ["craft", "technique", "handwork", "artisan", "embroidery"],
  weave: ["weave", "texture", "thread", "stitch"],
  closure: ["closure", "fastening", "zip", "button"],
  festive: ["festive wear", "Eid collection", "celebrations", "occasion wear"],
  craft_type: ["hand embroidery", "nakshi kantha", "traditional craft", "artisan technique"],
  heritage: ["Bengali heritage", "Bangladeshi tradition", "cultural wear", "folk art"],
  fit: ["fit", "silhouette", "cut", "shape"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function extractNGrams(tokens: string[], minN = 2, maxN = 3): string[] {
  const result: string[] = [];
  for (let n = minN; n <= Math.min(maxN, tokens.length); n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      result.push(tokens.slice(i, i + n).join(" "));
    }
  }
  return result;
}

function dedupPhrases(phrases: string[]): string[] {
  const seen = new Set<string>();
  return phrases.filter((p) => {
    const key = p.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseBackendKeywords(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

function mergeKeywords(backendRaw: string | null | undefined, frontendGenerated: string[]): string[] {
  const backend = parseBackendKeywords(backendRaw);
  const combined = [...backend, ...TYPO_KEYWORDS, ...frontendGenerated];
  return dedupPhrases(combined);
}

function getBengaliKeywords(): string[] {
  return [
    ...BENGALI_KEYWORDS,
    ...BENGALI_FESTIVE_KEYWORDS,
    ...BENGALI_CRAFT_KEYWORDS,
    ...BENGALI_LOCATIONS,
  ];
}

function getLanguageKeywords(lang?: string): string[] {
  if (lang?.toLowerCase() === "bn") return getBengaliKeywords();
  return [];
}

const BANGLADESH_LOCATIONS = [
  "Bangladesh", "Dhaka", "Chattogram", "Rangpur", "Kurigram", "Ulipur",
  "Sylhet", "Khulna", "Rajshahi", "Barishal", "Mymensingh",
];

const FESTIVE_KEYWORDS = [
  "Eid ul-Fitr", "Eid ul-Adha", "Pohela Boishakh", "Pahela Falgun",
  "Durga Puja", "Bijoya Dashami", "wedding season", "festive collection",
];

export function buildProductKeywords(product: ProductDetail, lang?: string): string[] {
  const result: string[] = [];

  // Core identity
  if (product.meta_title) result.push(product.meta_title);
  if (product.name) {
    result.push(product.name);
    const tokens = tokenize(product.name);
    result.push(...extractNGrams(tokens));
  }

  // Category hierarchy
  const categoryName = product.primary_category?.name;
  if (categoryName) {
    result.push(categoryName);
    result.push(`${categoryName} Bangladesh`);
    result.push(`handmade ${categoryName.toLowerCase()}`);
    result.push(`${categoryName} online`);
  }

  // Tags
  (product.tags || []).forEach((tag) => {
    if (typeof tag === "string") result.push(tag);
    else if (tag && typeof tag === "object" && "name" in tag) result.push((tag as { name: string }).name);
  });

  // Attributes → long-tail clusters
  (product.attributes || []).forEach((attr) => {
    const slug = (attr.attribute?.slug || "").toLowerCase();
    const value = attr.value || "";
    if (!value) return;
    result.push(value);
    if (attr.attribute?.name) {
      result.push(`${attr.attribute.name} ${value}`);
      result.push(`${value} ${attr.attribute.name}`);
    }
    const kwGroup = ATTRIBUTE_KEYWORDS[slug];
    if (kwGroup) {
      kwGroup.forEach((ctx) => result.push(`${value} ${ctx}`));
    }
  });

  // Material-based long-tail
  const materialAttr = (product.attributes || []).find(
    (a) => a.attribute?.slug === "material" || a.attribute?.slug === "fabric"
  );
  if (materialAttr?.value && categoryName) {
    result.push(`${materialAttr.value} ${categoryName.toLowerCase()}`);
    result.push(`${materialAttr.value} ${categoryName.toLowerCase()} Bangladesh`);
  }

  if (product.material_breakdown) {
    Object.keys(product.material_breakdown).forEach((mat) => {
      result.push(mat);
      if (categoryName) result.push(`${mat.toLowerCase()} ${categoryName.toLowerCase()}`);
    });
  }

  // Festive & occasion clusters
  if (categoryName) {
    FESTIVE_KEYWORDS.forEach((festival) => {
      result.push(`${festival} ${categoryName.toLowerCase()}`);
      result.push(`${festival} collection Bangladesh`);
    });
  }

  // Location-based
  BANGLADESH_LOCATIONS.forEach((loc) => {
    if (categoryName) result.push(`${categoryName.toLowerCase()} ${loc}`);
    if (product.name) {
      const shortName = product.name.split(" ").slice(0, 3).join(" ").toLowerCase();
      if (shortName.length > 5) result.push(`${shortName} ${loc}`);
    }
  });

  // Transactional long-tail
  result.push("buy online Bangladesh");
  result.push("free delivery Bangladesh");
  result.push("cash on delivery Bangladesh");
  if (categoryName) {
    result.push(`buy ${categoryName.toLowerCase()} online`);
    result.push(`${categoryName.toLowerCase()} price Bangladesh`);
    result.push(`best ${categoryName.toLowerCase()} Bangladesh`);
  }

  // Craft/heritage signals
  result.push("hand embroidered Bangladesh");
  result.push("artisan made Bangladesh");
  result.push("traditional Bangladeshi craft");

  // Language-specific keywords
  const langKW = getLanguageKeywords(lang);
  if (langKW.length) result.push(...langKW);

  return mergeKeywords(product.meta_keywords, result).slice(0, 50);
}

export function buildCategoryKeywords(
  category: { name: string; description?: string | null; children?: Array<{ name: string }>; meta_keywords?: string | null },
  lang?: string,
): string[] {
  const result: string[] = [];

  if (category.name) {
    result.push(category.name);
    result.push(`${category.name} collection`);
    result.push(`${category.name} Bangladesh`);
    result.push(`handmade ${category.name.toLowerCase()}`);
    result.push(`hand embroidered ${category.name.toLowerCase()}`);
    result.push(`traditional ${category.name.toLowerCase()} Bangladesh`);
    const tokens = tokenize(category.name);
    result.push(...extractNGrams(tokens));
  }

  if (category.description) {
    const descTokens = tokenize(category.description).slice(0, 8);
    descTokens.forEach((t) => result.push(t));
    result.push(...extractNGrams(descTokens, 2, 2));
  }

  (category.children || []).forEach((child) => {
    if (child.name) {
      result.push(child.name);
      result.push(`${category.name.toLowerCase()} ${child.name.toLowerCase()}`);
      result.push(`buy ${child.name.toLowerCase()} online`);
      result.push(`${child.name.toLowerCase()} Bangladesh`);
    }
  });

  FESTIVE_KEYWORDS.forEach((festival) => {
    result.push(`${festival} ${category.name.toLowerCase()}`);
    result.push(`${festival} collection`);
  });

  BANGLADESH_LOCATIONS.forEach((loc) => {
    result.push(`${category.name.toLowerCase()} ${loc}`);
  });

  result.push(`buy ${category.name.toLowerCase()} online`);
  result.push(`${category.name.toLowerCase()} price Bangladesh`);
  result.push(`best ${category.name.toLowerCase()} Bangladesh`);
  result.push(`artisan ${category.name.toLowerCase()}`);
  result.push(`${category.name.toLowerCase()} free delivery`);

  // Language-specific keywords
  const langKW = getLanguageKeywords(lang);
  if (langKW.length) result.push(...langKW);

  return mergeKeywords(category.meta_keywords, result).slice(0, 35);
}

export function buildPageKeywords(title: string, excerpt?: string | null, metaKeywords?: string | null, lang?: string): string[] {
  const result: string[] = [];
  if (title) {
    result.push(title);
    result.push(...extractNGrams(tokenize(title)));
    result.push(`${title} | Bunoraa`);
  }
  if (excerpt) {
    const tokens = tokenize(excerpt).slice(0, 10);
    tokens.forEach((t) => result.push(t));
    result.push(...extractNGrams(tokens, 2, 2));
  }
  result.push("Bunoraa Bangladesh");
  result.push("artisan marketplace Bangladesh");
  result.push("handmade Bangladesh");

  // Language-specific keywords
  const langKW = getLanguageKeywords(lang);
  if (langKW.length) result.push(...langKW);

  return mergeKeywords(metaKeywords, result).slice(0, 20);
}

export function buildProductSchema(product: ProductDetail) {
  const url = absoluteUrl(buildProductPath(product));
  const images = [
    product.primary_image || undefined,
    ...(product.images?.map((image) => image.image) || []),
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i) as string[];

  const parsePrice = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed =
      typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const fallbackPrice = product.current_price || product.sale_price || product.price || undefined;

  const variantOffers = (product.variants || [])
    .map((variant) => {
      const variantPrice = variant.current_price || variant.price || fallbackPrice || undefined;
      if (!variantPrice || !product.currency) return null;
      const optionLabel =
        variant.option_values?.map((item) => `${item.option.name}: ${item.value}`).join(" / ") ||
        undefined;
      return cleanObject({
        "@type": "Offer",
        sku: variant.sku || undefined,
        name: optionLabel ? `${product.name} - ${optionLabel}` : undefined,
        price: variantPrice,
        priceCurrency: product.currency,
        availability:
          typeof variant.stock_quantity === "number"
            ? variant.stock_quantity > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock"
            : product.is_in_stock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: SITE_NAME,
        },
        url,
      });
    })
    .filter(Boolean);

  const variantPrices = variantOffers
    .map((offer) => parsePrice((offer as { price?: string | number }).price))
    .filter((value): value is number => typeof value === "number");

  const offerFallback =
    fallbackPrice && product.currency
      ? cleanObject({
          "@type": "Offer",
          price: fallbackPrice,
          priceCurrency: product.currency,
          availability: product.is_in_stock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: SITE_NAME,
          },
          url,
        })
      : undefined;

  const offers =
    variantOffers.length > 1 && variantPrices.length
      ? cleanObject({
          "@type": "AggregateOffer",
          priceCurrency: product.currency || undefined,
          lowPrice: Math.min(...variantPrices).toFixed(2),
          highPrice: Math.max(...variantPrices).toFixed(2),
          offerCount: variantOffers.length,
          offers: variantOffers.slice(0, 20),
          availability: product.is_in_stock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        })
      : variantOffers[0] || offerFallback;

  const attributeBySlug = new Map<string, string>();
  (product.attributes || []).forEach((item) => {
    if (!item.attribute?.slug || !item.value) return;
    attributeBySlug.set(item.attribute.slug.toLowerCase(), item.value);
  });
  const color = attributeBySlug.get("color") || attributeBySlug.get("colour") || undefined;
  const size = attributeBySlug.get("size") || undefined;
  const pattern = attributeBySlug.get("pattern") || undefined;

  const additionalProperty =
    product.attributes?.length
      ? product.attributes.slice(0, 20).map((item) =>
          cleanObject({
            "@type": "PropertyValue",
            name: item.attribute.name,
            value: item.value,
          })
        )
      : undefined;
  const material =
    product.material_breakdown && Object.keys(product.material_breakdown).length
      ? Object.keys(product.material_breakdown).join(", ")
      : undefined;

  const aggregateRating =
    typeof product.average_rating === "number" && product.reviews_count
      ? cleanObject({
          "@type": "AggregateRating",
          ratingValue: product.average_rating,
          reviewCount: product.reviews_count,
          bestRating: 5,
        })
      : undefined;

  const hasVariant =
    product.variants?.length
      ? product.variants.slice(0, 20).map((variant) =>
          cleanObject({
            "@type": "ProductModel",
            sku: variant.sku || undefined,
            name: variant.option_values?.length
              ? `${product.name} - ${variant.option_values
                  .map((value) => `${value.option.name}: ${value.value}`)
                  .join(" / ")}`
              : undefined,
            offers: variantOffers.find((offer) => {
              const sku = (offer as { sku?: string }).sku;
              if (sku && variant.sku) return sku === variant.sku;
              return false;
            }),
          })
        )
      : undefined;

  return cleanObject({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.meta_title || product.name,
    description:
      product.meta_description ||
      product.short_description ||
      product.description ||
      undefined,
    sku: product.sku || undefined,
    mpn: product.sku || undefined,
    image: images.length ? images.map((image) => absoluteUrl(image)) : undefined,
    url,
    mainEntityOfPage: url,
    category: product.primary_category?.name,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    color,
    size,
    pattern,
    material,
    additionalProperty,
    offers,
    aggregateRating,
    hasVariant,
  });
}

export function buildLocalBusinessSchema(settings?: SiteSettings | null) {
  const name = settings?.company_name || settings?.site_name || SITE_NAME;
  const sameAs = [
    settings?.facebook_url,
    settings?.instagram_url,
    settings?.youtube_url,
    settings?.twitter_url,
  ].filter(Boolean) as string[];
  return cleanObject({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": absoluteUrl("/#localbusiness"),
    name,
    url: absoluteUrl("/"),
    address: cleanObject({
      "@type": "PostalAddress",
      streetAddress: settings?.contact_address || undefined,
      addressLocality: settings?.address_locality || undefined,
      addressRegion: settings?.address_region || undefined,
      addressCountry: "BD",
    }),
    telephone: settings?.contact_phone || undefined,
    email: settings?.contact_email || undefined,
    image: absoluteUrl("/icon.png"),
    priceRange: settings?.currency_symbol || "৳",
    sameAs: sameAs.length ? sameAs : undefined,
    areaServed: "Bangladesh",
    hasOfferCatalog: cleanObject({
      "@type": "OfferCatalog",
      name: `${name} Products`,
      itemListElement: [
        { "@type": "OfferCatalog", name: "Women's Fashion" },
        { "@type": "OfferCatalog", name: "Kids' Clothing" },
        { "@type": "OfferCatalog", name: "Home Decor" },
      ],
    }),
  });
}

export function buildCombinedKeywords(primary: string, secondary: string[]): string[] {
  const result: string[] = [primary];
  secondary.forEach((s) => {
    result.push(`${primary} ${s}`);
    result.push(`${s} ${primary}`);
  });
  result.push(`${primary} Bangladesh`);
  result.push(`buy ${primary.toLowerCase()} online Bangladesh`);
  result.push(`best ${primary.toLowerCase()} Bangladesh`);
  return dedupPhrases(result);
}
