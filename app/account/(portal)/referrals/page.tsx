import dynamic from "next/dynamic";

const AccountReferralsPageContent = dynamic(
  () =>
    import("@/components/account/AccountReferralsPageContent").then(
      (mod) => mod.AccountReferralsPageContent
    ),
  {
    loading: () => (
      <div className="p-6 text-sm text-muted-foreground">Loading referrals...</div>
    ),
  }
);

export default function ReferralsPage() {
  return <AccountReferralsPageContent />;
}
