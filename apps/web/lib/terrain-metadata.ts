export type TerrainDevelopmentType = "OPEN" | "CLOSED";

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

export function withTerrainDevelopmentType(
  metadata: unknown,
  developmentType: TerrainDevelopmentType
) {
  const current = objectValue(metadata);
  const property = objectValue(current.property);

  return {
    ...current,
    property: {
      ...property,
      developmentType
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
