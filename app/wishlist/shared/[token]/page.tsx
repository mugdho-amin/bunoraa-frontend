import dynamic from "next/dynamic";

const SharedWishlistPageContent = dynamic(
  () => import("@/components/wishlist/SharedWishlistPageContent").then((mod) => mod.SharedWishlistPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-foreground/60">Loading wishlist...</div> }
);

export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SharedWishlistPageContent token={token} />;
}
