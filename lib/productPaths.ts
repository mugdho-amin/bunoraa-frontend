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
 * Resolves the primary subcategory slug intended for contextual filtering
 * or fallback collection navigation.
 */
export function getProductCategoryPath(product: ProductPathSource): string {
  const precomputedPath = cleanSegment(product.primary_category_slug_path);
  if (precomputedPath) return precomputedPath;

  if (product.breadcrumbs?.length) {
    const directParentSlug = cleanSegment(product.breadcrumbs[product.breadcrumbs.length - 1]?.slug);
    if (directParentSlug) return directParentSlug;
  }

  const primaryCategorySlug = cleanSegment(product.primary_category?.slug);
  if (primaryCategorySlug) return primaryCategorySlug;

  return "all";
}

/**
 * Generates the unified, flat canonical URL path for product detail views.
 * Enforces strict trailing slashes for directory consistency.
 */
export function buildProductPath(product: ProductPathSource): string {
  const slug = cleanSegment(product.slug);
  if (!slug) return "/products/";
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
    product.breadcrumbs.forEach((crumb) => {
      const slug = cleanSegment(crumb.slug);
      const name = (crumb.name || "").trim();
      if (!slug || !name) return;

      // Because the taxonomy uses globally unique slugs mapped to explicit top-level
      // directory folders, we do not compound parent segments.
      trail.push({
        name,
        slugPath: slug
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