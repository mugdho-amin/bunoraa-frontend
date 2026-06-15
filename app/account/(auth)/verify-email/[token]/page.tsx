import { VerifyEmailPageContent } from "@/components/auth/VerifyEmailPageContent";

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <VerifyEmailPageContent token={token} />;
}
