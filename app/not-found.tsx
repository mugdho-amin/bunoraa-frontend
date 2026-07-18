import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70dvh] items-center justify-center overflow-hidden bg-background px-3 py-16 text-foreground sm:px-5 sm:py-20">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-80" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-lg flex-col items-center gap-5 text-center">
        <p className="text-[clamp(4rem,15vw,8rem)] font-extrabold leading-none tracking-tight text-primary/15">404</p>
        <h1 className="text-display font-semibold tracking-tight text-balance">
          Page not found
        </h1>
        <p className="max-w-md text-sm text-foreground/65 text-pretty sm:text-base">
          The page you are looking for doesn&apos;t exist or may have moved.
          Try searching or head back to the storefront.
        </p>
        <div className="mt-2 flex w-full max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center">
          <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
            <Link href="/search/">
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </Link>
          </Button>
        </div>
        <Link
          href="/products/"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground/55 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Browse all products
        </Link>
      </div>
    </div>
  );
}
