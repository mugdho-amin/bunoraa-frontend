import dynamic from "next/dynamic";

const OrderTrackPageContent = dynamic(
  () => import("@/components/orders/OrderTrackPageContent").then((mod) => mod.OrderTrackPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading tracking...</div> }
);

export default function OrderTrackPage() {
  return <OrderTrackPageContent />;
}
