import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md">
        <WifiOff className="mx-auto mb-6 h-16 w-16 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="mb-3 text-2xl font-semibold tracking-tight">
          You&apos;re offline
        </h1>
        <p className="mb-8 text-muted-foreground">
          Please check your internet connection and try again.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full bg-foreground px-8 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
