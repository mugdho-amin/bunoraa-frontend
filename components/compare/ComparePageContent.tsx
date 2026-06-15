"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import type { ProductDetail } from "@/lib/types";
import { getCompareItems, clearCompareItems } from "@/lib/compare";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductPrice } from "@/components/products/ProductPrice";
import { RatingStars } from "@/components/products/RatingStars";
import { buildProductPath } from "@/lib/productPaths";

export function ComparePageContent() {
  const [items, setItems] = React.useState(getCompareItems());
  const [details, setDetails] = React.useState<Record<string, ProductDetail>>({});

  React.useEffect(() => {
    const handler = () => setItems(getCompareItems());
    handler();
    window.addEventListener("compare-updated", handler);
    return () => window.removeEventListener("compare-updated", handler);
  }, []);

  React.useEffect(() => {
    const load = async () => {
      const next: Record<string, ProductDetail> = {};
      await Promise.all(items.map(async (item) => { try { const response = await apiFetch<ProductDetail>(`/catalog/products/${item.slug}/`); next[item.id] = response.data; } catch { return; } }));
      setDetails(next);
    };
    if (items.length) load();
  }, [items]);

  if (!items.length) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-5 py-12">
          <Card variant="bordered" className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Compare products</h1>
            <p className="text-sm text-foreground/70">Add products to compare from the catalog.</p>
            <Button asChild variant="primary-gradient"><Link href="/products/">Browse products</Link></Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-5 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Compare</p><h1 className="text-3xl font-semibold">Side-by-side details</h1></div>
          <Button variant="ghost" onClick={() => { clearCompareItems(); setItems([]); }}>Clear compare list</Button>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-4 text-sm text-foreground/60">
            <div className="font-semibold text-foreground">Overview</div>
            <div>Price</div><div>Rating</div><div>Stock</div><div>Category</div><div>Description</div><div>Attributes</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => {
              const detail = details[item.id];
              return (
                <Card key={item.id} variant="bordered" className="space-y-3 p-4">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                    {item.primary_image ? <Image src={item.primary_image} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw" loading="lazy" decoding="async" /> : null}
                    <Button asChild size="sm" variant="ghost" className="absolute right-2 top-2 h-7 w-7 rounded-full bg-background/70 p-0 backdrop-blur"><Link href={buildProductPath(item)}>View</Link></Button>
                  </div>
                  <div><p className="text-sm font-semibold">{item.name}</p></div>
                  <div>{detail ? <ProductPrice price={detail.current_price} salePrice={detail.sale_price} currency={detail.currency || "BDT"} /> : <span className="text-sm text-foreground/50">Loading...</span>}</div>
                  <div>{detail ? <RatingStars rating={detail.average_rating || 0} count={detail.reviews_count} size="sm" /> : <span className="text-sm text-foreground/50">-</span>}</div>
                  <div className="text-sm">{detail ? (detail.is_in_stock ? "In stock" : "Out of stock") : item.is_in_stock !== undefined ? (item.is_in_stock ? "In stock" : "Out of stock") : "Unknown"}</div>
                  <div className="text-sm text-foreground/60">{detail?.primary_category?.name || item.primary_category_name || "General"}</div>
                  <div className="text-xs text-foreground/60 line-clamp-3">{detail?.description || "No description"}</div>
                  <div className="space-y-1 text-xs text-foreground/60">
                    {detail?.attributes?.slice(0, 3).map((attr, idx) => <div key={attr.id || idx}><span className="capitalize">{(attr.attribute?.name || "")}:</span> {attr.value}</div>)}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
