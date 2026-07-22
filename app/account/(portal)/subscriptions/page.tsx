import dynamic from "next/dynamic";

const AccountSubscriptionsPageContent = dynamic(
  () => import("@/components/subscriptions/AccountSubscriptionsPageContent").then((mod) => mod.AccountSubscriptionsPageContent),
  { loading: () => <div className="p-6 text-sm text-muted-foreground">Loading subscriptions...</div> }
);

export default function SubscriptionsPage() {
  return <AccountSubscriptionsPageContent />;
}
