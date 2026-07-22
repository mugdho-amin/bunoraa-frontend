import dynamic from "next/dynamic";

const AccountSecurityPageContent = dynamic(
  () => import("@/components/account/AccountSecurityPageContent").then((mod) => mod.AccountSecurityPageContent),
  { loading: () => <div className="p-6 text-sm text-muted-foreground">Loading security settings...</div> }
);

export default function SecurityPage() {
  return <AccountSecurityPageContent />;
}
