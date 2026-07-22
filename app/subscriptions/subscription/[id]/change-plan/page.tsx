import dynamic from "next/dynamic";

const SubscriptionChangePlanContent = dynamic(
  () => import("@/components/subscriptions/SubscriptionChangePlanContent").then((mod) => mod.SubscriptionChangePlanContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div> }
);

export default function ChangePlanPage() {
  return <SubscriptionChangePlanContent />;
}
