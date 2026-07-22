import dynamic from "next/dynamic";

const OrderDetailPageContent = dynamic(
  () => import("@/components/orders/OrderDetailPageContent").then((mod) => mod.OrderDetailPageContent),
  { loading: () => <div className="p-6 text-sm text-muted-foreground">Loading order...</div> }
);

export default function OrderDetailPage() {
  return <OrderDetailPageContent />;
}
