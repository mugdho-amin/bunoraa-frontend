import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Subscription Plans",
  description: "Explore Bunoraa subscription plans and recurring delivery options.",
  path: "/subscriptions/",
});

const SubscriptionPlansPageContent = dynamic(
  () => import("@/components/subscriptions/SubscriptionPlansPageContent").then((mod) => mod.SubscriptionPlansPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading plans...</div> }
);

export default function SubscriptionsLandingPage() {
  return <SubscriptionPlansPageContent />;
}
