import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";

function CartSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-5 py-12">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="bordered" className="flex gap-4 p-4">
                <div className="h-28 w-28 shrink-0 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-1/4 rounded bg-muted animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <Card variant="bordered" className="space-y-4 p-4">
              <div className="h-6 w-36 rounded bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
              </div>
              <div className="h-12 w-full rounded bg-muted animate-pulse" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const CartPageView = dynamic(
  () => import("@/components/cart/CartPage").then((mod) => mod.CartPage),
  { loading: CartSkeleton }
);

export default function CartPage() {
  return <CartPageView />;
}
