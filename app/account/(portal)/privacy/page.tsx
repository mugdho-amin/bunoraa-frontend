import dynamic from "next/dynamic";

const AccountPrivacyPageContent = dynamic(
  () =>
    import("@/components/account/AccountPrivacyPageContent").then(
      (mod) => mod.AccountPrivacyPageContent
    ),
  {
    loading: () => (
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    ),
  }
);

export default function PrivacyPage() {
  return <AccountPrivacyPageContent />;
}
