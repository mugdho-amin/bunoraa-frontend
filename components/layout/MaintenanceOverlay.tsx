"use client";

import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { MaintenanceContent } from "@/components/layout/MaintenanceContent";

export function MaintenanceOverlay() {
  const settings = useSiteSettings();

  if (settings?.maintenance_mode !== true) {
    return null;
  }

  const brandName =
    settings?.company_name?.trim() || settings?.site_name?.trim() || "Bunoraa";

  return (
    <div className="fixed inset-0 z-[9999] bg-background">
      <MaintenanceContent
        brandName={brandName}
        logo={settings?.logo || settings?.logo_dark || null}
        supportEmail={settings?.support_email || settings?.contact_email || null}
      />
    </div>
  );
}
