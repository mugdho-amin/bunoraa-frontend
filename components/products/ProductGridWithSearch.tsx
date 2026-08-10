"use client";

import * as React from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { ProductListItem, ApiPagination } from "@/lib/types";
import { InfiniteProductGrid } from "@/components/products/InfiniteProductGrid";
import {
  searchParamsToRecord,
  buildProductRequestParams,
} from "@/lib/productParams";

export function ProductGridWithSearch({
  endpoint,
  initialProducts,
  initialPagination,
  cols,
  cardStyle,
}: {
  endpoint: string;
  initialProducts: ProductListItem[];
  initialPagination?: ApiPagination;
  cols: number;
  cardStyle?: "default" | "minimal" | "fashion";
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [data, setData] = React.useState({ products: initialProducts, pagination: initialPagination });

  const lastParamsRef = React.useRef(`${pathname}?${searchParams.toString()}`);

  React.useEffect(() => {
    setData({ products: initialProducts, pagination: initialPagination });
  }, [initialProducts, initialPagination]);

  React.useEffect(() => {
    const currentKey = `${pathname}?${searchParams.toString()}`;
    if (currentKey === lastParamsRef.current) return;
    lastParamsRef.current = currentKey;

    const record = searchParamsToRecord(searchParams);
    const requestParams = buildProductRequestParams(record);

    apiFetch<ProductListItem[]>(endpoint, { params: requestParams })
      .then((response) => {
        const rawData = response.data as
          | ProductListItem[]
          | { results?: ProductListItem[]; count?: number; next?: string | null };
        const products = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.results)
            ? rawData.results
            : [];
        const pagination =
          response.meta?.pagination ||
          (rawData && !Array.isArray(rawData)
            ? {
                count: (rawData as Record<string, unknown>).count as number ?? products.length,
                next: (rawData as Record<string, unknown>).next as string | null ?? null,
                previous: (rawData as Record<string, unknown>).previous as string | null ?? null,
                page: 1,
                page_size: products.length,
                total_pages: (rawData as Record<string, unknown>).count
                  ? Math.max(1, Math.ceil((rawData as Record<string, unknown>).count as number / Math.max(products.length, 1)))
                  : 1,
              }
            : undefined);

        setData({ products, pagination });
      })
      .catch(() => {});
  }, [pathname, searchParams, endpoint]);

  const record = searchParamsToRecord(searchParams);
  const requestParams = buildProductRequestParams(record);
  const resetKey = JSON.stringify({ endpoint, params: requestParams, cols });

  return (
    <InfiniteProductGrid
      endpoint={endpoint}
      requestParams={requestParams}
      initialProducts={data.products}
      initialPagination={data.pagination}
      resetKey={resetKey}
      cols={cols}
      cardStyle={cardStyle}
    />
  );
}
