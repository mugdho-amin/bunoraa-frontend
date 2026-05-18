export const ProductGridSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
    ))}
  </div>
);

export const SectionSkeleton = ({ title }: { title?: string }) => (
  <div className="py-8">
    {title ? <div className="h-4 w-32 animate-pulse rounded bg-muted" /> : null}
    <div className="mt-4">
      <ProductGridSkeleton />
    </div>
  </div>
);
