import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-lg bg-muted", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export const ProductGridSkeleton = ({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) => (
  <div
    className={cn(
      "grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-6 lg:grid-cols-4",
      className
    )}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
        <Skeleton className="h-3 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
    ))}
  </div>
);

export const SectionSkeleton = ({
  title,
  className,
}: {
  title?: string;
  className?: string;
}) => (
  <div className={cn("section-pad page-shell", className)} role="status" aria-busy="true">
    {title ? (
      <p className="sr-only">{title}</p>
    ) : null}
    <Skeleton className="h-3 w-28 rounded-md sm:w-36" />
    <div className="mt-4">
      <ProductGridSkeleton />
    </div>
  </div>
);

export const PageHeaderSkeleton = () => (
  <div className="page-shell py-6 sm:py-8">
    <Skeleton className="h-8 w-48 rounded-lg sm:h-10 sm:w-64" />
    <Skeleton className="mt-3 h-4 w-full max-w-md rounded-md" />
  </div>
);

export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    ))}
    <Skeleton className="mt-2 h-11 w-full rounded-xl sm:w-40" />
  </div>
);
