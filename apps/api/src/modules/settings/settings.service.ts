import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma/prisma.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";

export type PublicSiteSettings = {
  brandName: string;
  logoUrl: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  defaultCreci: string;
  socialInstagramUrl: string;
  socialFacebookUrl: string;
  socialYoutubeUrl: string;
  socialXUrl: string;
  socialTiktokUrl: string;
  socialLinkedinUrl: string;
  socialWhatsappUrl: string;
};

const defaults: PublicSiteSettings = {
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

const settingKeys = [
  "brandName",
  "logoUrl",
  "logoLightUrl",
  "logoDarkUrl",
  "defaultCreci",
  "socialInstagramUrl",
  "socialFacebookUrl",
  "socialYoutubeUrl",
  "socialXUrl",
  "socialTiktokUrl",
  "socialLinkedinUrl",
  "socialWhatsappUrl"
];

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async publicSettings(): Promise<PublicSiteSettings> {
    const rows = await this.prisma.siteSetting.findMany({
      where: { key: { in: settingKeys } }
    });

    const byKey = new Map(rows.map((row) => [row.key, row.value]));
    const legacyLogoUrl = stringValue(byKey.get("logoUrl")) || null;
    const logoLightUrl = stringValue(byKey.get("logoLightUrl")) || legacyLogoUrl || defaults.logoLightUrl;
    const logoDarkUrl = stringValue(byKey.get("logoDarkUrl")) || legacyLogoUrl || defaults.logoDarkUrl;

    return {
      brandName: stringValue(byKey.get("brandName")) || defaults.brandName,
      logoUrl: logoLightUrl,
      logoLightUrl,
      logoDarkUrl,
      defaultCreci: stringValue(byKey.get("defaultCreci")) || defaults.defaultCreci,
      socialInstagramUrl: stringValue(byKey.get("socialInstagramUrl")) || defaults.socialInstagramUrl,
      socialFacebookUrl: stringValue(byKey.get("socialFacebookUrl")) || defaults.socialFacebookUrl,
      socialYoutubeUrl: stringValue(byKey.get("socialYoutubeUrl")) || defaults.socialYoutubeUrl,
      socialXUrl: stringValue(byKey.get("socialXUrl")) || defaults.socialXUrl,
      socialTiktokUrl: stringValue(byKey.get("socialTiktokUrl")) || defaults.socialTiktokUrl,
      socialLinkedinUrl: stringValue(byKey.get("socialLinkedinUrl")) || defaults.socialLinkedinUrl,
      socialWhatsappUrl: stringValue(byKey.get("socialWhatsappUrl")) || defaults.socialWhatsappUrl
    };
  }

  async update(dto: UpdateSiteSettingsDto) {
    const entries = [
      ["brandName", dto.brandName?.trim()],
      ["logoUrl", dto.logoUrl?.trim()],
      ["logoLightUrl", dto.logoLightUrl?.trim()],
      ["logoDarkUrl", dto.logoDarkUrl?.trim()],
      ["defaultCreci", dto.defaultCreci?.trim()],
      ["socialInstagramUrl", dto.socialInstagramUrl?.trim()],
      ["socialFacebookUrl", dto.socialFacebookUrl?.trim()],
      ["socialYoutubeUrl", dto.socialYoutubeUrl?.trim()],
      ["socialXUrl", dto.socialXUrl?.trim()],
      ["socialTiktokUrl", dto.socialTiktokUrl?.trim()],
      ["socialLinkedinUrl", dto.socialLinkedinUrl?.trim()],
      ["socialWhatsappUrl", dto.socialWhatsappUrl?.trim()]
    ].filter((entry): entry is [string, string] => entry[1] !== undefined);

    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );

    return this.publicSettings();
  }
}
