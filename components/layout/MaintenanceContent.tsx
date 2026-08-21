import Image from "next/image";
import { Mail, Wrench } from "lucide-react";

type MaintenanceContentProps = {
  brandName: string;
  logo?: string | null;
  supportEmail?: string | null;
};

export function MaintenanceContent({ brandName, logo, supportEmail }: MaintenanceContentProps) {
  return (
    <div
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background p-4 sm:p-6"
      role="alert"
      aria-live="assertive"
    >
      <meta name="robots" content="noindex, nofollow" />
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center sm:gap-8">
        {logo ? (
          <Image
            src={logo}
            alt={brandName}
            width={80}
            height={80}
            className="h-16 w-16 rounded-xl object-contain shadow-soft sm:h-20 sm:w-20"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-100 text-warning-600 shadow-soft animate-scale-in dark:bg-warning-900/40 dark:text-warning-300 sm:h-20 sm:w-20">
            <Wrench size={36} aria-hidden="true" />
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {brandName}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-balance">
            We&rsquo;ll be back soon
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
            We are currently performing scheduled maintenance to make your shopping experience
            better. Please check back in a little while.
          </p>
        </div>

        {supportEmail ? (
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-accent"
          >
            <Mail size={16} aria-hidden="true" />
            {supportEmail}
          </a>
        ) : null}
      </div>
    </div>
  );
}
