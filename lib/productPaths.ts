import type { ProductDetail } from "@/lib/types";

type ProductPathSource = Pick<ProductDetail, "slug" | "primary_category" | "breadcrumbs"> & {
  primary_category_slug_path?: string | null;
};

/**
 * Sanitizes and normalizes URL path segments by stripping whitespace
 * and leading/trailing forward slashes.
 */
function cleanSegment(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

/**
 * Resolves the primary category slug path for SEO-friendly product URLs.
 * Returns the full slash-separated path (e.g. "kids/girls-frocks-outfits").
 */
export function getProductCategoryPath(product: ProductPathSource): string {
  const precomputedPath = cleanSegment(product.primary_category_slug_path);
  if (precomputedPath) return precomputedPath;

  if (product.breadcrumbs?.length) {
    const fullPath = product.breadcrumbs
      .map(crumb => cleanSegment(crumb.slug))
      .filter(Boolean)
      .join("/");
    if (fullPath) return fullPath;
  }

  const primaryCategorySlug = cleanSegment(product.primary_category?.slug);
  if (primaryCategorySlug) return primaryCategorySlug;

  return "";
}

/**
 * Generates the SEO-friendly nested URL path for a product.
 * Uses the product's primary category trail to produce URLs like
 * /kids/girls-frocks-outfits/{slug}/. Falls back to /products/{slug}/
 * when no category information is available.
 */
export function buildProductPath(product: ProductPathSource): string {
  const slug = cleanSegment(product.slug);
  if (!slug) return "/products/";

  const categoryPath = getProductCategoryPath(product);
  if (categoryPath) {
    return `/${categoryPath}/${slug}/`;
  }

  return `/products/${slug}/`;
}

/**
 * Constructs absolute navigation trails for frontend breadcrumbs.
 * Leverages globally distinct slugs to safely map directly to root-level folder groups.
 */
export function buildProductCategoryTrail(
  product: ProductPathSource
): Array<{ name: string; slugPath: string }> {
  const trail: Array<{ name: string; slugPath: string }> = [];

  if (product.breadcrumbs?.length) {
    let accumulatedPath = "";
    product.breadcrumbs.forEach((crumb) => {
      const slug = cleanSegment(crumb.slug);
      const name = (crumb.name || "").trim();
      if (!slug || !name) return;

      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${slug}` : slug;
      trail.push({
        name,
        slugPath: accumulatedPath
      });
    });

    if (trail.length) return trail;
  }

  const primarySlug = cleanSegment(product.primary_category?.slug);
  const primaryName = (product.primary_category?.name || "").trim();
  if (primarySlug && primaryName) {
    return [{ name: primaryName, slugPath: primarySlug }];
  }

  return [];
}