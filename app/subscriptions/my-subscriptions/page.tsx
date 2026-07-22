import dynamic from "next/dynamic";

const MySubscriptionsPageContent = dynamic(
  () => import("@/components/subscriptions/MySubscriptionsPageContent").then((mod) => mod.MySubscriptionsPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading subscriptions...</div> }
);

export default function MySubscriptionsPage() {
  return <MySubscriptionsPageContent />;
}
