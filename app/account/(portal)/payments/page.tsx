import dynamic from "next/dynamic";

const AccountPaymentsPageContent = dynamic(
  () =>
    import("@/components/account/AccountPaymentsPageContent").then(
      (mod) => mod.AccountPaymentsPageContent
    ),
  {
    loading: () => (
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    ),
  }
);

export default function PaymentsPage() {
  return <AccountPaymentsPageContent />;
}
