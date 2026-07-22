"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { useUiMessages } from "@/components/i18n/useUiMessages";

export function OrderProcessingModal({ isOpen }: { isOpen: boolean }) {
  const { t } = useUiMessages("checkout");
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <Card variant="bordered" className="w-full max-w-md p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
            <div className="absolute top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold">
          {t("processing_your_order", "Processing your order")}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("processing_order_wait", "Please wait while we finalize your order and redirect you.")}
        </p>
      </Card>
    </div>
  );
}
