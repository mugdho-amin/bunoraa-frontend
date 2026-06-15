import dynamic from "next/dynamic";

const AccountAddressEditPageContent = dynamic(
  () =>
    import("@/components/account/AccountAddressEditPageContent").then(
      (mod) => mod.AccountAddressEditPageContent
    ),
  {
    loading: () => (
      <div className="p-6 text-sm text-foreground/70">Loading...</div>
    ),
  }
);

export default function EditAddressPage() {
  return <AccountAddressEditPageContent />;
}
