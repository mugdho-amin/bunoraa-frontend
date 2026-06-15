import dynamic from "next/dynamic";

const OrdersTrackPageContent = dynamic(
  () => import("@/components/orders/OrdersTrackPageContent").then((mod) => mod.OrdersTrackPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-foreground/60">Loading...</div> }
);

export default function OrdersTrackPage() {
  return <OrdersTrackPageContent />;
}
