import Link from "next/link";
import { Home, MapPin, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthenticatedSimulationLink } from "@/components/marketplace/authenticated-simulation-link";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { MediaGallery } from "@/components/marketplace/media-gallery";
import { TerrainCreciBadge } from "@/components/marketplace/terrain-creci-badge";
import { TerrainProjectSelector } from "@/components/marketplace/terrain-project-selector";
import { area, money, toNumber } from "@/lib/format";
import { getTerrainPhoto } from "@/lib/terrain-images";
import { getTerrainDevelopmentType, getTerrainPropertyDetails, terrainDevelopmentLabel } from "@/lib/terrain-metadata";
import { getTerrain } from "@/services/terrains";

export default async function TerrainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const terrain = await getTerrain(id);
  const fallbackImage = getTerrainPhoto(terrain);
  const developmentType = getTerrainDevelopmentType(terrain.metadata);
  const propertyDetails = getTerrainPropertyDetails(terrain.metadata);
  const terrainSimulationParams = new URLSearchParams({
    mode: "TERRAIN",
    terrainId: terrain.id,
    terrainTitle: terrain.title,
    terrainPrice: String(toNumber(terrain.price))
  });
  const detailItems = [
    ["Tipo", propertyDetails.propertyType ?? "Terreno"],
    ["Destino", propertyDetails.destination ?? "Residencial"],
    ["Situacao", propertyDetails.situation ?? "Nao informado"],
    ["Frente", terrain.frontageM ? `${terrain.frontageM} m` : "Nao informado"],
    ["Fundo", terrain.depthM ? `${terrain.depthM} m` : "Nao informado"],
    propertyDetails.iptuValue ? ["IPTU", money(propertyDetails.iptuValue)] : null,
    propertyDetails.condominiumValue ? ["Condominio", money(propertyDetails.condominiumValue)] : null
  ].filter(Boolean) as Array<[string, string]>;
  const gallery = [
    ...(terrain.images ?? []).map((image, index) => ({
      src: image.url,
      alt: image.altText ?? `${terrain.title} - foto ${index + 1}`,
      label: image.isCover ? "Capa" : `Foto ${index + 1}`
    })),
    terrain.images?.length ? null : { src: fallbackImage, alt: `Terreno ${terrain.title}`, label: "Foto principal" }
  ].filter(Boolean) as Array<{ src: string; alt: string; label: string }>;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-8">
        <MediaGallery items={gallery} title={terrain.title} />
        <aside className="min-w-0 self-start rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5 lg:p-6">
          <div className="flex min-w-0 items-center gap-2 text-xs uppercase text-[var(--muted)] sm:text-sm sm:normal-case">
            <MapPin className="shrink-0" size={16} />
            <span className="min-w-0 truncate">{[terrain.neighborhood, terrain.city, terrain.state].filter(Boolean).join(", ")}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {developmentType ? (
              <p className="text-sm font-semibold text-[var(--accent)]">
                {terrainDevelopmentLabel(developmentType)}
              </p>
            ) : null}
            <TerrainCreciBadge metadata={terrain.metadata} />
          </div>
          <h1 className="mt-2 break-words text-2xl font-semibold sm:mt-3 sm:text-3xl lg:text-4xl">{terrain.title}</h1>
          <p className="mt-3 break-words text-sm leading-6 text-[var(--muted)] sm:mt-4 sm:text-base sm:leading-7">{terrain.description}</p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
            <div className="rounded-[8px] border border-[var(--line)] p-3 sm:p-4">
              <p className="text-xs uppercase text-[var(--muted)] sm:text-sm sm:normal-case">Valor</p>
              <strong className="text-lg sm:text-xl">{money(terrain.price)}</strong>
            </div>
            <div className="rounded-[8px] border border-[var(--line)] p-3 sm:p-4">
              <p className="text-xs uppercase text-[var(--muted)] sm:text-sm sm:normal-case">Area</p>
              <strong className="inline-flex items-center gap-2 text-lg sm:text-xl">
                <Ruler size={17} />
                {area(terrain.areaM2)}
              </strong>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:gap-3">
            {detailItems.map(([label, value]) => (
              <div className="rounded-[8px] border border-[var(--line)] px-3 py-2" key={label}>
                <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
                <strong className="mt-1 block break-words text-[var(--foreground)]">{value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
            <AuthenticatedSimulationLink className="w-full sm:w-auto" href={`/simulacao?${terrainSimulationParams.toString()}`}>
              Simular somente terreno
            </AuthenticatedSimulationLink>
            <Link className="w-full sm:w-auto" href="#monte-sua-casa">
              <Button className="w-full sm:w-auto" variant="secondary">
                <Home size={18} />
                Escolha sua casa
              </Button>
            </Link>
            <FavoriteButton targetId={terrain.id} targetType="terrain" />
          </div>
        </aside>
      </div>
      <TerrainProjectSelector terrain={terrain} />
    </section>
  );
}
