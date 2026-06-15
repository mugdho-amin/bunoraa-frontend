import dynamic from "next/dynamic";

const AccountProfilePageContent = dynamic(
  () => import("@/components/account/AccountProfilePageContent").then((mod) => mod.AccountProfilePageContent),
  { loading: () => <div className="p-6 text-sm text-foreground/70">Loading profile...</div> }
);

export default function ProfilePage() {
  return <AccountProfilePageContent />;
}
