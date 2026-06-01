import Link from "next/link";
import { Heart, Home, MapPin, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerrainProjectSelector } from "@/components/marketplace/terrain-project-selector";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money } from "@/lib/format";
import { getTerrain } from "@/services/terrains";

export default async function TerrainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const terrain = await getTerrain(id);
  const image = terrain.images?.[0]?.url;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)]">
          {image ? <PrivacyImage alt={terrain.title} className="h-[520px] w-full object-cover" src={image} /> : null}
        </div>
        <aside className="self-start rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <MapPin size={17} />
            {terrain.city}, {terrain.state}
          </div>
          <h1 className="mt-3 text-4xl font-semibold">{terrain.title}</h1>
          <p className="mt-4 leading-7 text-[var(--muted)]">{terrain.description}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-[var(--line)] p-4">
              <p className="text-sm text-[var(--muted)]">Valor</p>
              <strong className="text-xl">{money(terrain.price)}</strong>
            </div>
            <div className="rounded-[8px] border border-[var(--line)] p-4">
              <p className="text-sm text-[var(--muted)]">Area</p>
              <strong className="inline-flex items-center gap-2 text-xl">
                <Ruler size={18} />
                {area(terrain.areaM2)}
              </strong>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/checkout?type=terrain&terrainId=${terrain.id}`}>
              <Button>Fechar somente terreno</Button>
            </Link>
            <Link href="#monte-sua-casa">
              <Button variant="secondary">
                <Home size={18} />
                Monte sua casa
              </Button>
            </Link>
            <Button aria-label="Favoritar terreno" variant="ghost">
              <Heart size={18} />
            </Button>
          </div>
        </aside>
      </div>
      <TerrainProjectSelector terrain={terrain} />
    </section>
  );
}
