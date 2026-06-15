import dynamic from "next/dynamic";

const NotificationPreferencesPageContent = dynamic(
  () => import("@/components/notifications/NotificationPreferencesPageContent").then((mod) => mod.NotificationPreferencesPageContent),
  { loading: () => <div className="p-6 text-sm text-foreground/70">Loading notification preferences...</div> }
);

export default function NotificationPreferencesPage() {
  return <NotificationPreferencesPageContent />;
}
