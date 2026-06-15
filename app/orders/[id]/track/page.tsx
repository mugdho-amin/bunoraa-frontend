import dynamic from "next/dynamic";

const OrderTrackPageContent = dynamic(
  () => import("@/components/orders/OrderTrackPageContent").then((mod) => mod.OrderTrackPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-foreground/60">Loading tracking...</div> }
);

export default function OrderTrackPage() {
  return <OrderTrackPageContent />;
}
