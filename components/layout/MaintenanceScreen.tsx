import { getSiteSettings } from "@/lib/siteSettings.server";
import { MaintenanceContent } from "@/components/layout/MaintenanceContent";

export async function MaintenanceScreen() {
  const settings = await getSiteSettings().catch(() => null);
  const brandName =
    settings?.company_name?.trim() || settings?.site_name?.trim() || "Bunoraa";

  return (
    <MaintenanceContent
      brandName={brandName}
      logo={settings?.logo || settings?.logo_dark || null}
      supportEmail={settings?.support_email || settings?.contact_email || null}
    />
  );
}
