import dynamic from "next/dynamic";

const AccountPreferencesPageContent = dynamic(
  () =>
    import("@/components/account/AccountPreferencesPageContent").then(
      (mod) => mod.AccountPreferencesPageContent
    ),
  {
    loading: () => (
      <div className="p-6 text-sm text-foreground/70">Loading...</div>
    ),
  }
);

export default function PreferencesPage() {
  return <AccountPreferencesPageContent />;
}
