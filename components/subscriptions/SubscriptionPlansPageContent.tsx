import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import type { SubscriptionPlan } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

async function getPlans() {
  try {
    const response = await apiFetch<SubscriptionPlan[]>("/subscriptions/plans/");
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 503)) {
      return [];
    }
    throw error;
  }
}

export async function SubscriptionPlansPageContent() {
  const plans = await getPlans();

  return (
    <div className="mx-auto w-full max-w-5xl px-[var(--page-gutter)] py-12">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Subscriptions
        </p>
        <h1 className="text-3xl font-semibold">Choose a plan</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} variant="bordered" className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
            <p className="text-lg font-semibold">
              {plan.price_amount} {plan.currency} / {plan.interval}
            </p>
            <Button asChild variant="primary-gradient">
              <Link href={`/subscriptions/plans/${plan.id}/`}>View plan</Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
