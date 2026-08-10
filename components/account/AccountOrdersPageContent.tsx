"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useOrders } from "@/components/orders/useOrders";
import { formatDateTime } from "@/lib/format";
import { formatNumber } from "@/lib/money";
import { formatMoney } from "@/lib/checkout";

export function AccountOrdersPageContent() {
  const [query, setQuery] = React.useState("");
  const ordersQuery = useOrders({ q: query.trim() || undefined, ordering: "newest" });

  return (
    <div className="space-y-6">
      <div><p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Account</p><h1 className="text-3xl font-semibold">Orders</h1><p className="mt-2 text-sm text-muted-foreground">Track every purchase, delivery state, and timeline.</p></div>
      <Card variant="bordered" className="p-4"><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by order number or tracking" className="h-10 w-full rounded-xl border border-border bg-transparent px-3 text-sm" /></Card>
      {ordersQuery.isLoading ? <Card variant="bordered" className="p-6 text-sm text-muted-foreground">Loading orders...</Card>
      : ordersQuery.isError ? <Card variant="bordered" className="p-6 text-sm text-muted-foreground">Could not load orders.</Card>
      : ordersQuery.data?.data?.length ? (
        <div className="space-y-4">{ordersQuery.data.data.map((order) => (
          <Card key={order.id} variant="bordered" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm text-muted-foreground">Order {order.order_number}</p><p className="text-lg font-semibold">{order.status_display || order.status}</p><p className="text-xs text-muted-foreground">{formatNumber(order.item_count)} items &bull; {formatDateTime(order.created_at)}</p></div>
            <div className="text-right"><p className="text-lg font-semibold">{formatMoney(order.total, order.currency)}</p><Link className="text-sm text-primary" href={`/orders/${order.id}/`}>View details</Link></div>
          </Card>
        ))}</div>
      ) : <Card variant="bordered" className="p-6 text-sm text-muted-foreground">You have no orders yet.</Card>}
    </div>
  );
}
