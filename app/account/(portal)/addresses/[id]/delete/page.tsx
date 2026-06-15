import dynamic from "next/dynamic";

const AccountAddressDeletePageContent = dynamic(
  () =>
    import("@/components/account/AccountAddressDeletePageContent").then(
      (mod) => mod.AccountAddressDeletePageContent
    ),
  {
    loading: () => (
      <div className="p-6 text-sm text-foreground/70">Loading...</div>
    ),
  }
);

export default function DeleteAddressPage() {
  return <AccountAddressDeletePageContent />;
}
