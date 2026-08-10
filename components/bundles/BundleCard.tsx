import Link from "next/link";
import Image from "next/image";
import type { Bundle } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/money";

export function BundleCard({ bundle }: { bundle: Bundle }) {
  const price = formatMoney(bundle.price, bundle.currency || "BDT");
  const worth = bundle.value ? parseFloat(bundle.value) : null;

  return (
    <Card variant="bordered" className="group flex flex-col overflow-hidden">
      <Link
        href={`/bundles/${bundle.slug}/`}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
        aria-label={bundle.name}
      >
        {bundle.image ? (
          <Image
            src={bundle.image}
            alt={bundle.name}
            fill
            quality={72}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        {bundle.savings ? (
          <Badge
            variant="success"
            className="absolute left-3 top-3 shadow-sm"
            title="Bundle savings"
          >
            Save {formatMoney(bundle.savings, bundle.currency || "BDT")}
          </Badge>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {bundle.is_featured ? (
            <Badge variant="accent">Featured</Badge>
          ) : null}
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Bundle
          </span>
        </div>
        <h2 className="text-lg font-semibold leading-snug">
          <Link href={`/bundles/${bundle.slug}/`} className="hover:text-primary">
            {bundle.name}
          </Link>
        </h2>
        {bundle.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {bundle.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-primary">
                {price}
              </span>
              {worth && worth > 0 ? (
                <span className="truncate text-xs text-muted-foreground line-through">
                  worth {formatMoney(worth, bundle.currency || "BDT")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {bundle.item_count ?? 0} items{" "}
              {bundle.available_units !== undefined && bundle.available_units > 0
                ? `· only ${bundle.available_units} left`
                : ""}
            </p>
          </div>
          <Link
            href={`/bundles/${bundle.slug}/`}
            className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
          >
            View bundle
          </Link>
        </div>
      </div>
    </Card>
  );
}