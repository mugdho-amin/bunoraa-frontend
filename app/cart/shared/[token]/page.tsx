import { Card } from "@/components/ui/Card";

export default async function SharedCartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="mx-auto w-full max-w-3xl px-[var(--page-gutter)] py-12">
      <Card variant="bordered" className="p-6 text-sm text-muted-foreground">
        Shared bags require a dedicated API endpoint. Token: {token}
      </Card>
    </div>
  );
}
