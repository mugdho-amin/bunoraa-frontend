import { ResetPasswordPageContent } from "@/components/auth/ResetPasswordPageContent";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ResetPasswordPageContent token={token} />;
}
