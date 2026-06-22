"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Bath, BedDouble, Home, Ruler, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money } from "@/lib/format";
import { Terrain } from "@/types/domain";

type Compatibility = NonNullable<Terrain["compatibilities"]>[number];

function buildProjectHref(projectId: string, terrainId: string) {
  return `/projetos/${projectId}?terrainId=${terrainId}` as Route;
}

function ProjectOption({ compatibility, terrainId }: { compatibility: Compatibility; terrainId: string }) {
  const { project } = compatibility;
  const image = project.images?.[0]?.url ?? project.renderUrl;

  return (
    <article className="min-w-0 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)]">
      <div className="aspect-[16/10] w-full overflow-hidden bg-[#dfe4dc]">
        {image ? (
          <PrivacyImage
            alt={project.images?.[0]?.altText ?? project.title}
            className="block h-full w-full object-cover"
            src={image}
          />
        ) : null}
      </div>

      <div className="grid min-w-0 gap-4 p-4">
        <div className="min-w-0">
          <p className="line-clamp-1 break-words text-xs uppercase text-[var(--muted)]">{project.style ?? "Projeto residencial"}</p>
          <h3 className="mt-2 line-clamp-2 break-words text-lg font-semibold leading-snug">{project.title}</h3>
          <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-[var(--muted)]">{project.description}</p>
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-2 text-sm text-[var(--muted)]">
          <span className="inline-flex min-w-0 items-center gap-1 rounded-[8px] border border-[var(--line)] px-2 py-2">
            <BedDouble className="shrink-0" size={15} />
            {project.bedrooms}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 rounded-[8px] border border-[var(--line)] px-2 py-2">
            <Bath className="shrink-0" size={15} />
            {project.bathrooms}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 rounded-[8px] border border-[var(--line)] px-2 py-2">
            <Ruler className="shrink-0" size={15} />
            <span className="min-w-0 truncate">{area(project.areaM2)}</span>
          </span>
        </div>

        <div className="grid min-w-0 gap-2 text-sm sm:grid-cols-2">
          <span className="min-w-0 break-words rounded-[8px] border border-[var(--line)] px-3 py-2">
            Projeto <strong>{money(project.price)}</strong>
          </span>
          <span className="min-w-0 break-words rounded-[8px] border border-[var(--line)] px-3 py-2">
            Obra <strong>{money(project.estimatedBuildCost)}</strong>
          </span>
        </div>

        <Link href={buildProjectHref(project.id, terrainId)}>
          <Button className="w-full" type="button" variant="secondary">
            Ver projeto
            <ArrowRight size={18} />
          </Button>
        </Link>
      </div>
    </article>
  );
}

export function TerrainProjectSelector({ terrain }: { terrain: Terrain }) {
  const compatibleProjects = terrain.compatibilities ?? [];

  return (
    <section className="mt-6 scroll-mt-24 sm:mt-8 lg:mt-10" id="monte-sua-casa">
      <div className="mb-4 flex min-w-0 flex-wrap items-end justify-between gap-3 sm:mb-5 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Sparkles className="shrink-0 text-[var(--accent)]" size={20} />
          <div className="min-w-0">
            <p className="text-sm uppercase text-[var(--muted)]">Projetos</p>
            <h2 className="break-words text-xl font-semibold sm:text-2xl">Projetos disponíveis para este terreno</h2>
          </div>
        </div>
      </div>

      {compatibleProjects.length ? (
        <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {compatibleProjects.map((compatibility) => (
            <ProjectOption compatibility={compatibility} key={compatibility.id} terrainId={terrain.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 text-[var(--muted)]">
          <Home className="mb-3 text-[var(--accent)]" size={22} />
          Ainda não existem projetos disponíveis para este terreno.
        </div>
      )}
    </section>
  );
}
