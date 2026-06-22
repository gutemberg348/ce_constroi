"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, MapPin, Ruler } from "lucide-react";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money } from "@/lib/format";
import { getTerrainPhoto } from "@/lib/terrain-images";
import { Terrain } from "@/types/domain";
import { FavoriteButton } from "./favorite-button";

export function TerrainCard({ terrain }: { terrain: Terrain }) {
  const image = getTerrainPhoto(terrain);
  const location = [terrain.neighborhood, terrain.city, terrain.state].filter(Boolean).join(", ");

  return (
    <article className="group min-w-0 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)] transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative">
        <Link className="block aspect-[16/10] w-full overflow-hidden bg-[#dfe4dc]" href={`/terrenos/${terrain.id}` as Route}>
          <PrivacyImage
            alt={`Terreno ${terrain.title}`}
            className="block h-full w-full object-cover transition duration-500 group-hover:scale-105"
            src={image}
          />
        </Link>
        <FavoriteButton className="absolute right-3 top-3" targetId={terrain.id} targetType="terrain" />
      </div>
      <Link className="block min-w-0 space-y-3 p-3 sm:space-y-4 sm:p-4" href={`/terrenos/${terrain.id}` as Route}>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2 text-xs uppercase text-[var(--muted)]">
            <MapPin className="shrink-0" size={14} />
            <span className="min-w-0 truncate">{location}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 break-words text-base font-semibold leading-snug sm:text-lg">{terrain.title}</h3>
        </div>
        <p className="line-clamp-2 break-words text-sm leading-6 text-[var(--muted)]">{terrain.description}</p>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 break-words font-semibold">{money(terrain.price)}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm text-[var(--muted)]">
            <Ruler className="shrink-0" size={15} />
            {area(terrain.areaM2)}
          </span>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
          Ver terreno <ArrowRight size={16} />
        </span>
      </Link>
    </article>
  );
}
