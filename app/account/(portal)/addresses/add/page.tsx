import dynamic from "next/dynamic";

const AccountAddressAddPageContent = dynamic(
  () =>
    import("@/components/account/AccountAddressAddPageContent").then(
      (mod) => mod.AccountAddressAddPageContent
    ),
  {
    loading: () => (
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
    ),
  }
);

export default function AddAddressPage() {
  return <AccountAddressAddPageContent />;
}
