import dynamic from "next/dynamic";

const PreorderSuccessPageContent = dynamic(
  () => import("@/components/preorders/PreorderSuccessPageContent").then((mod) => mod.PreorderSuccessPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-foreground/60">Loading...</div> }
);

export default async function PreorderSuccessPage({
  params,
}: {
  params: Promise<{ preorder_number: string }>;
}) {
  const { preorder_number } = await params;
  return <PreorderSuccessPageContent preorder_number={preorder_number} />;
}
