"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/useAuth";
import { Card } from "@/components/ui/Card";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    router.replace("/");
  }, [logout, router]);

  return (
    <div className="mx-auto w-full max-w-md px-[var(--page-gutter)] py-20">
      <Card variant="bordered" className="p-6 text-sm text-muted-foreground">
        Signing out...
      </Card>
    </div>
  );
}
