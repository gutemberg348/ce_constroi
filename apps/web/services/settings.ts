import { api, unwrap } from "./api";
import { SiteSettings } from "@/types/domain";

export const defaultSiteSettings: SiteSettings = {
  brandName: "Ce constroi",
  logoUrl: "/brand/logo-light.svg",
  logoLightUrl: "/brand/logo-light.svg",
  logoDarkUrl: "/brand/logo-dark.svg"
};

export async function getSiteSettings() {
  try {
    const response = await api.get<SiteSettings>("/settings");
    return unwrap<SiteSettings>(response);
  } catch {
    return defaultSiteSettings;
  }
}

export async function updateSiteSettings(input: Partial<SiteSettings>) {
  const response = await api.patch<SiteSettings>("/settings", input);
  return unwrap<SiteSettings>(response);
}
