import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { getSiteSettings } from "@/lib/siteSettings.server";

export default async function Loading() {
  const settings = await getSiteSettings();

  return <LoadingScreen fullScreen fallbackLogoSrc={settings?.logo || settings?.favicon} />;
}
