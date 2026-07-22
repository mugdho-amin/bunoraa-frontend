import dynamic from "next/dynamic";

const AccountChangePasswordPageContent = dynamic(
  () =>
    import("@/components/account/AccountChangePasswordPageContent").then(
      (mod) => mod.AccountChangePasswordPageContent
    ),
  {
    loading: () => (
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    ),
  }
);

export default function ChangePasswordPage() {
  return <AccountChangePasswordPageContent />;
}
