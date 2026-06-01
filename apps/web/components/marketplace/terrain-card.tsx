import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, MapPin, Ruler } from "lucide-react";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money } from "@/lib/format";
import { Terrain } from "@/types/domain";

export function TerrainCard({ terrain }: { terrain: Terrain }) {
  const image = terrain.images?.[0]?.url;

  return (
    <Link
      className="group block overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)] transition hover:-translate-y-0.5 hover:shadow-xl"
      href={`/terrenos/${terrain.id}` as Route}
    >
      <div className="aspect-[16/10] overflow-hidden bg-[#dfe4dc]">
        {image ? (
          <PrivacyImage
            alt={terrain.images?.[0]?.altText ?? terrain.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            src={image}
          />
        ) : null}
      </div>
      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase text-[var(--muted)]">
            <MapPin size={14} />
            {terrain.city}, {terrain.state}
          </div>
          <h3 className="mt-2 text-lg font-semibold">{terrain.title}</h3>
        </div>
        <p className="line-clamp-2 text-sm text-[var(--muted)]">{terrain.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{money(terrain.price)}</span>
          <span className="inline-flex items-center gap-1 text-sm text-[var(--muted)]">
            <Ruler size={15} />
            {area(terrain.areaM2)}
          </span>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
          Ver terreno <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
