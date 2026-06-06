import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma/prisma.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";

export type PublicSiteSettings = {
  brandName: string;
  logoUrl: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
};

const defaults: PublicSiteSettings = {
  brandName: "Ce constroi",
  logoUrl: "/brand/logo-light.svg",
  logoLightUrl: "/brand/logo-light.svg",
  logoDarkUrl: "/brand/logo-dark.svg"
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async publicSettings(): Promise<PublicSiteSettings> {
    const rows = await this.prisma.siteSetting.findMany({
      where: { key: { in: ["brandName", "logoUrl", "logoLightUrl", "logoDarkUrl"] } }
    });

    const byKey = new Map(rows.map((row) => [row.key, row.value]));
    const legacyLogoUrl = stringValue(byKey.get("logoUrl")) || null;
    const logoLightUrl = stringValue(byKey.get("logoLightUrl")) || legacyLogoUrl || defaults.logoLightUrl;
    const logoDarkUrl = stringValue(byKey.get("logoDarkUrl")) || legacyLogoUrl || defaults.logoDarkUrl;

    return {
      brandName: stringValue(byKey.get("brandName")) || defaults.brandName,
      logoUrl: logoLightUrl,
      logoLightUrl,
      logoDarkUrl
    };
  }

  async update(dto: UpdateSiteSettingsDto) {
    const entries = [
      ["brandName", dto.brandName?.trim()],
      ["logoUrl", dto.logoUrl?.trim()],
      ["logoLightUrl", dto.logoLightUrl?.trim()],
      ["logoDarkUrl", dto.logoDarkUrl?.trim()]
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
