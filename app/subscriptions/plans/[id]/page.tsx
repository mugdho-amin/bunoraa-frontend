import dynamic from "next/dynamic";

const SubscriptionPlanDetailContent = dynamic(
  () => import("@/components/subscriptions/SubscriptionPlanDetailContent").then((mod) => mod.SubscriptionPlanDetailContent),
  { loading: () => <div className="p-8 text-center text-sm text-foreground/60">Loading plan...</div> }
);

export default function SubscriptionPlanPage() {
  return <SubscriptionPlanDetailContent />;
}
