import dynamic from "next/dynamic";

const SubscriptionDetailContent = dynamic(
  () => import("@/components/subscriptions/SubscriptionDetailContent").then((mod) => mod.SubscriptionDetailContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading subscription...</div> }
);

export default function SubscriptionDetailPage() {
  return <SubscriptionDetailContent />;
}
