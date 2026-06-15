import dynamic from "next/dynamic";

const WishlistPageContent = dynamic(
  () => import("@/components/wishlist/WishlistPageContent").then((mod) => mod.WishlistPageContent),
  { loading: () => <div className="p-8 text-center text-sm text-foreground/60">Loading wishlist...</div> }
);

export default function WishlistPage() {
  return <WishlistPageContent />;
}
