import dynamic from "next/dynamic";

const PreorderCreateStepPageContent = dynamic(
  () => import("@/components/preorders/PreorderCreateStepPageContent").then((mod) => mod.PreorderCreateStepPageContent),
  { loading: () => <div className="p-6 text-sm text-foreground/70">Loading...</div> }
);

export default function PreorderCreateStepPage() {
  return <PreorderCreateStepPageContent />;
}
