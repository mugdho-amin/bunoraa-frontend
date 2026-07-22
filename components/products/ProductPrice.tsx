import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

export function ProductPrice({
  price,
  salePrice,
  currentPrice,
  compareAtPrice,
  currency,
  className,
  priceClassName,
  salePriceClassName,
}: {
  price?: string | null;
  salePrice?: string | null;
  currentPrice?: string | null;
  compareAtPrice?: string | null;
  currency: string;
  className?: string;
  priceClassName?: string;
  salePriceClassName?: string;
}) {
  const base = currentPrice || salePrice || price || "";
  const showSale = Boolean(salePrice && price && salePrice !== price);
  const showCompareAt = Boolean(!showSale && compareAtPrice && price && compareAtPrice !== price);
  const strikethroughPrice = showSale ? price : (showCompareAt ? compareAtPrice : null);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("text-lg font-semibold", priceClassName)}>
        {formatMoney(base, currency)}
      </span>
      {strikethroughPrice ? (
        <span className={cn("text-sm text-muted-foreground line-through", salePriceClassName)}>
          {formatMoney(strikethroughPrice, currency)}
        </span>
      ) : null}
    </div>
  );
}
