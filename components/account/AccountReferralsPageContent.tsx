"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Gift, Copy, Check, Share2, Users, Coins } from "lucide-react";
import type { ReferralInfo } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

async function fetchReferralInfo() {
  const response = await apiFetch<ReferralInfo>("/accounts/referrals/");
  return response.data;
}

export function AccountReferralsPageContent() {
  const [copied, setCopied] = React.useState(false);
  const query = useQuery({
    queryKey: ["referrals"],
    queryFn: fetchReferralInfo,
    retry: false,
  });

  const referralData = query.data;
  const referralUrl = referralData?.referral_url || "";
  const referralCode = referralData?.referral_code || "";

  const handleCopy = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail if clipboard API unavailable
    }
  };

  const handleShare = async () => {
    if (!referralUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Bunoraa",
          text: `Shop hand-embroidered fashion and artisan goods on Bunoraa. Use my referral link: ${referralUrl}`,
          url: referralUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Account</p>
          <h1 className="text-3xl font-semibold">Referrals</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Loading your referral information...
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="bordered" className="h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || !referralData) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Account</p>
          <h1 className="text-3xl font-semibold">Referrals</h1>
        </div>
        <Card variant="bordered" className="flex flex-col items-center gap-4 py-12 text-center">
          <Gift className="h-12 w-12 text-foreground/20" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">Referral program coming soon</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Invite friends to Bunoraa and earn credits when they shop. Stay tuned!
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Account</p>
        <h1 className="text-3xl font-semibold">Referrals</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Invite friends to Bunoraa and earn credits on every purchase they make.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="bordered" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold">{referralData.total_referrals ?? 0}</p>
            <p className="text-xs text-foreground/60">Total referrals</p>
          </div>
        </Card>
        <Card variant="bordered" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold">{referralData.active_referrals ?? 0}</p>
            <p className="text-xs text-foreground/60">Active</p>
          </div>
        </Card>
        <Card variant="bordered" className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-semibold">
              {referralData.credits_earned || "0"} {referralData.credits_currency || ""}
            </p>
            <p className="text-xs text-foreground/60">Credits earned</p>
          </div>
        </Card>
      </div>

      <Card variant="bordered" className="space-y-4">
        <h2 className="text-lg font-semibold">Your referral link</h2>
        <p className="text-sm text-foreground/70">
          Share this link with friends. You earn credits when they place their first order.
        </p>
        {referralCode ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center font-mono text-sm">
            {referralCode}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy link
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </Card>

      {referralData.recent_referrals && referralData.recent_referrals.length > 0 ? (
        <Card variant="bordered" className="space-y-4">
          <h2 className="text-lg font-semibold">Recent referrals</h2>
          <div className="divide-y divide-border">
            {referralData.recent_referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {r.email || "Anonymous"}
                  </p>
                  <p className="text-xs text-foreground/60">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                      r.status === "converted"
                        ? "bg-green-100 text-green-700"
                        : r.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-foreground/60"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.reward ? (
                    <span className="text-xs font-semibold text-green-700">
                      +{r.reward}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
