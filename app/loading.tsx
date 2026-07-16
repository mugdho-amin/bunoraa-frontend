function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-muted/60 ${className ?? ""}`}
    />
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <SkeletonBlock className="aspect-[4/5] w-full" />
      <SkeletonBlock className="h-3 w-3/4" />
      <SkeletonBlock className="h-4 w-1/2" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="relative flex h-[min(620px,max(280px,calc(100dvh-var(--header-offset,5.5rem)-1rem)))] w-full flex-col items-center justify-center overflow-hidden bg-muted/30">
        <SkeletonBlock className="absolute inset-0 rounded-none" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-4">
          <SkeletonBlock className="h-8 w-72 sm:h-10 sm:w-96" />
          <SkeletonBlock className="h-4 w-48 sm:w-64" />
        </div>
      </div>

      <div className="mx-auto max-w-[1920px] space-y-12 px-4 py-12 sm:px-6">
        {/* Featured products skeleton */}
        <section className="space-y-6">
          <SkeletonBlock className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Categories skeleton */}
        <section className="space-y-6">
          <SkeletonBlock className="h-6 w-40" />
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-3">
                <SkeletonBlock className="h-24 w-24 rounded-full" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
            ))}
          </div>
        </section>

        {/* New arrivals skeleton */}
        <section className="space-y-6">
          <SkeletonBlock className="h-6 w-44" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
