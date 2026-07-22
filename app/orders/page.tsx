import dynamic from "next/dynamic";

const OrdersPageContent = dynamic(
  () => import("@/components/orders/OrdersPageContent").then((mod) => mod.OrdersPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading orders...</div> }
);

export default function OrdersPage() {
  return <OrdersPageContent />;
}
