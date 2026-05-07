import { ProductGrid } from "@/components/products/ProductGrid";
import Link from "next/link";
import { ProductListItem, Category } from "@/lib/types";

interface CategoryBandProps {
  band: {
    category: Category;
    products: ProductListItem[];
  };
}

export const CategoryBand = ({ band }: CategoryBandProps) => {
  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/70">
          {band.category.name}
        </h2>
        <Link
          href={`/${band.category.slug_path || band.category.slug}/`}
          prefetch={false}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground"
        >
          View All
        </Link>
      </div>
      <div className="mt-4">
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
