import dynamic from "next/dynamic";

const PreorderDetailPageContent = dynamic(
  () => import("@/components/preorders/PreorderDetailPageContent").then((mod) => mod.PreorderDetailPageContent),
  { loading: () => <div className="p-6 text-sm text-muted-foreground">Loading preorder...</div> }
);

export default async function PreorderDetailPage({ params }: { params: Promise<{ preorder_number: string }> }) {
  const { preorder_number } = await params;
  return <PreorderDetailPageContent preorderNumber={preorder_number} />;
}
