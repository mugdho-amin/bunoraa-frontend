import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default async function Loading() {
  // No settings needed for static loading
  return <LoadingScreen fullScreen fallbackLogoSrc="/icon.svg" />;
}
