import dynamic from "next/dynamic";

const NotificationsPageContent = dynamic(
  () => import("@/components/notifications/NotificationsPageContent").then((mod) => mod.NotificationsPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-muted-foreground">Loading notifications...</div> }
);

export default function NotificationsPage() {
  return <NotificationsPageContent />;
}
