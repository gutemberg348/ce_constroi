import Link from "next/link";
import { Home, MapPin, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { MediaGallery } from "@/components/marketplace/media-gallery";
import { TerrainCreciBadge } from "@/components/marketplace/terrain-creci-badge";
import { TerrainProjectSelector } from "@/components/marketplace/terrain-project-selector";
import { area, money } from "@/lib/format";
import { getTerrainPhoto } from "@/lib/terrain-images";
import { getTerrainDevelopmentType, terrainDevelopmentLabel } from "@/lib/terrain-metadata";
import { getTerrain } from "@/services/terrains";

export default async function TerrainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const terrain = await getTerrain(id);
  const fallbackImage = getTerrainPhoto(terrain);
  const developmentType = getTerrainDevelopmentType(terrain.metadata);
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
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <MediaGallery items={gallery} title={terrain.title} />
        <aside className="self-start rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-2 text-xs uppercase text-[var(--muted)] sm:text-sm sm:normal-case">
            <MapPin size={16} />
            {[terrain.neighborhood, terrain.city, terrain.state].filter(Boolean).join(", ")}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {developmentType ? (
              <p className="text-sm font-semibold text-[var(--accent)]">
                {terrainDevelopmentLabel(developmentType)}
              </p>
            ) : null}
            <TerrainCreciBadge metadata={terrain.metadata} />
          </div>
          <h1 className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-3xl lg:text-4xl">{terrain.title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)] sm:mt-4 sm:text-base sm:leading-7">{terrain.description}</p>
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
          <div className="mt-5 grid gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
            <Link className="w-full sm:w-auto" href={`/checkout?type=terrain&terrainId=${terrain.id}`}>
              <Button className="w-full sm:w-auto">Fechar somente terreno</Button>
            </Link>
            <Link className="w-full sm:w-auto" href="#monte-sua-casa">
              <Button className="w-full sm:w-auto" variant="secondary">
                <Home size={18} />
                Monte sua casa
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
