import { Suspense } from "react";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { Card } from "@/components/ui/Card";

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-[var(--page-gutter)] py-16">
        <div className="mb-8">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="mt-2 h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="mt-2 h-4 w-96 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card variant="bordered" className="space-y-4 p-6">
              <div className="h-6 w-48 rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
            </Card>
          </div>
          <div>
            <Card variant="bordered" className="space-y-4 p-6">
              <div className="h-6 w-36 rounded bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-12 w-full rounded bg-muted animate-pulse" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutRoute() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutPage />
    </Suspense>
  );
}
