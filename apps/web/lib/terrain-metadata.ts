export type TerrainDevelopmentType = "OPEN" | "CLOSED";

export type TerrainPropertyDetails = {
  propertyType?: string;
  destination?: string;
  situation?: string;
  developmentType?: TerrainDevelopmentType;
  iptuValue?: number;
  condominiumValue?: number;
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function getTerrainDevelopmentType(metadata: unknown): TerrainDevelopmentType | undefined {
  const property = objectValue(objectValue(metadata).property);
  return property.developmentType === "OPEN" || property.developmentType === "CLOSED"
    ? property.developmentType
    : undefined;
}

export function getTerrainCreci(metadata: unknown) {
  const owner = objectValue(objectValue(metadata).owner);
  return typeof owner.creci === "string" && owner.creci.trim()
    ? owner.creci.trim()
    : undefined;
}

export function resolveTerrainCreci(metadata: unknown, defaultCreci?: string | null) {
  return getTerrainCreci(metadata) ?? defaultCreci?.trim() ?? "";
}

export function withTerrainDevelopmentType(
  metadata: unknown,
  developmentType: TerrainDevelopmentType
) {
  return withTerrainPropertyDetails(metadata, { developmentType });
}

export function getTerrainPropertyDetails(metadata: unknown): TerrainPropertyDetails {
  const property = objectValue(objectValue(metadata).property);

  return {
    propertyType: typeof property.propertyType === "string" ? property.propertyType : undefined,
    destination: typeof property.destination === "string" ? property.destination : undefined,
    situation: typeof property.situation === "string" ? property.situation : undefined,
    developmentType: getTerrainDevelopmentType(metadata),
    iptuValue: typeof property.iptuValue === "number" ? property.iptuValue : undefined,
    condominiumValue: typeof property.condominiumValue === "number" ? property.condominiumValue : undefined
  };
}

export function withTerrainPropertyDetails(
  metadata: unknown,
  details: TerrainPropertyDetails
) {
  const current = objectValue(metadata);
  const property = objectValue(current.property);
  const cleaned = Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined && value !== "")
  );

  return {
    ...current,
    property: {
      ...property,
      ...cleaned
    }
  };
}

export function terrainDevelopmentLabel(type?: TerrainDevelopmentType) {
  if (type === "OPEN") {
    return "Local aberto";
  }

  if (type === "CLOSED") {
    return "Condomínio ou loteamento fechado";
  }

  return "Não informado";
}
