import { api, unwrap } from "./api";
import { SiteSettings } from "@/types/domain";

export const defaultSiteSettings: SiteSettings = {
  brandName: "Ce constroi",
  logoUrl: "/brand/ce-constroi-logo.png",
  logoLightUrl: "/brand/ce-constroi-logo.png",
  logoDarkUrl: "/brand/ce-constroi-logo.png",
  defaultCreci: "",
  socialInstagramUrl: "",
  socialFacebookUrl: "",
  socialYoutubeUrl: "",
  socialXUrl: "",
  socialTiktokUrl: "",
  socialLinkedinUrl: "",
  socialWhatsappUrl: ""
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
