"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/Card";

export function VerifyEmailPageContent({ token }: { token: string }) {
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  useEffect(() => {
    if (!token) return;
    apiFetch("/accounts/email/verify/", { method: "POST", body: { token } }).then(() => setStatus("success")).catch(() => setStatus("error"));
  }, [token]);

  return <div className="mx-auto w-full max-w-md px-3 sm:px-5 py-20"><Card variant="bordered" className="p-6 text-sm text-foreground/70">
    {status === "pending" && "Verifying your email..."}
    {status === "success" && "Email verified successfully. You can sign in now."}
    {status === "error" && "Verification failed. The token may be invalid or expired."}
  </Card></div>;
}
