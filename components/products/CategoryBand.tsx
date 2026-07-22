import { ProductGrid } from "@/components/products/ProductGrid";
import type { ProductListItem, Category } from "@/lib/types";
import { buildCategoryPath } from "@/lib/categoryPaths";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface CategoryBandProps {
  band: {
    category: Category;
    products: ProductListItem[];
  };
}

export const CategoryBand = ({ band }: CategoryBandProps) => {
  return (
    <section className="page-shell section-pad" aria-labelledby={`band-${band.category.id}`}>
      <SectionHeading
        id={`band-${band.category.id}`}
        title={band.category.name}
        href={buildCategoryPath(band.category.slug_path || band.category.slug)}
        linkLabel="View all"
        as="h2"
      />
      <div className="-mx-[var(--page-gutter)] px-[var(--page-gutter)] lg:mx-0 lg:px-0">
        <ProductGrid
          products={band.products}
          cardStyle="minimal"
          allowQuickView={true}
          showWishlist={true}
        />
      </div>
    </section>
  );
};
