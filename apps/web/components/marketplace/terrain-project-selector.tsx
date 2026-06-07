"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, Home, Ruler, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { HousePreview3D } from "@/components/marketplace/house-preview-3d";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money, toNumber, type NumericValue } from "@/lib/format";
import { Project, Terrain } from "@/types/domain";

type Compatibility = NonNullable<Terrain["compatibilities"]>[number];

function numeric(value: NumericValue) {
  return toNumber(value);
}

function buildSimulationHref(terrain: Terrain, project: Project) {
  const params = new URLSearchParams({
    terrainId: terrain.id,
    projectId: project.id,
    terrainTitle: terrain.title,
    projectTitle: project.title,
    terrainPrice: String(numeric(terrain.price)),
    projectPrice: String(numeric(project.price)),
    buildCost: String(numeric(project.estimatedBuildCost))
  });

  return `/simulacao?${params.toString()}` as Route;
}

function ProjectOption({
  compatibility,
  isSelected,
  onSelect
}: {
  compatibility: Compatibility;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { project } = compatibility;
  const image = project.images?.[0]?.url ?? project.renderUrl;
  const score = numeric(compatibility.score);

  return (
    <div
      className={`grid gap-3 rounded-[8px] border bg-[var(--panel)] p-3 transition sm:gap-4 sm:p-4 md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] ${
        isSelected ? "border-[var(--accent)] shadow-xl" : "border-[var(--line)]"
      }`}
    >
      <div className="aspect-[16/10] overflow-hidden rounded-[8px] bg-[#dfe4dc] md:aspect-auto md:h-full">
        {image ? (
          <PrivacyImage
            alt={project.images?.[0]?.altText ?? project.title}
            className="h-full w-full object-cover"
            src={image}
          />
        ) : null}
      </div>
      <div className="grid gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-[var(--muted)]">
            <span>{project.style ?? "Projeto residencial"}</span>
            <span>Score {score.toFixed(0)}%</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold sm:text-xl">{project.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-5 text-[var(--muted)] sm:leading-6">{project.description}</p>
        </div>

        <div className="grid gap-2 text-xs sm:grid-cols-3 sm:text-sm">
          <span className="rounded-[8px] border border-[var(--line)] px-3 py-2">
            Projeto {money(project.price)}
          </span>
          <span className="rounded-[8px] border border-[var(--line)] px-3 py-2">
            Obra {money(project.estimatedBuildCost)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 py-2">
            <Ruler size={15} />
            {area(project.areaM2)}
          </span>
        </div>

        <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <Button className="w-full sm:w-auto" onClick={onSelect} type="button" variant={isSelected ? "secondary" : "primary"}>
            {isSelected ? <CheckCircle2 size={18} /> : <Home size={18} />}
            {isSelected ? "Projeto selecionado" : "Selecionar este projeto"}
          </Button>
          <span className="text-sm leading-5 text-[var(--muted)]">{compatibility.notes ?? "Projeto compativel com este lote."}</span>
        </div>
      </div>
    </div>
  );
}

export function TerrainProjectSelector({ terrain }: { terrain: Terrain }) {
  const compatibleProjects = terrain.compatibilities ?? [];
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    compatibleProjects[0]?.project.id ?? null
  );
  const selectedCompatibility = useMemo(
    () => compatibleProjects.find((item) => item.project.id === selectedProjectId) ?? compatibleProjects[0] ?? null,
    [compatibleProjects, selectedProjectId]
  );
  const selectedProject = selectedCompatibility?.project ?? null;
  const packageTotal = selectedProject
    ? numeric(terrain.price) + numeric(selectedProject.price) + numeric(selectedProject.estimatedBuildCost)
    : numeric(terrain.price);

  return (
    <section className="mt-6 scroll-mt-24 sm:mt-8 lg:mt-10" id="monte-sua-casa">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Sparkles className="text-[var(--accent)]" size={20} />
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Monte sua casa</p>
            <h2 className="text-xl font-semibold sm:text-2xl">Projetos que cabem neste terreno</h2>
          </div>
        </div>
      </div>

      {compatibleProjects.length ? (
        <div className="grid gap-4 sm:gap-6">
          {selectedProject ? (
            <div>
              <HousePreview3D
                key={selectedProject.id}
                note={selectedCompatibility?.notes}
                project={selectedProject}
                score={selectedCompatibility?.score}
                terrain={terrain}
              />
            </div>
          ) : null}

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="grid gap-4">
              {compatibleProjects.map((compatibility) => (
                <ProjectOption
                  compatibility={compatibility}
                  isSelected={selectedProject?.id === compatibility.project.id}
                  key={compatibility.id}
                  onSelect={() => setSelectedProjectId(compatibility.project.id)}
                />
              ))}
            </div>

            {selectedProject ? (
              <aside className="lg:sticky lg:top-24">
                <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4">
                  <p className="text-sm text-[var(--muted)]">Resumo do pacote</p>
                  <h3 className="mt-2 text-lg font-semibold sm:text-xl">
                    {selectedProject.title} em {terrain.title}
                  </h3>
                  <div className="mt-4 grid gap-3 text-sm">
                    <SummaryLine label="Terreno" value={money(terrain.price)} />
                    <SummaryLine label="Projeto" value={money(selectedProject.price)} />
                    <SummaryLine label="Obra estimada" value={money(selectedProject.estimatedBuildCost)} />
                    <SummaryLine label="Total estimado" value={money(packageTotal)} strong />
                  </div>
                  <Link href={buildSimulationHref(terrain, selectedProject)}>
                    <Button className="mt-5 w-full" type="button">
                      Ir para simulacao
                      <ArrowRight size={18} />
                    </Button>
                  </Link>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 text-[var(--muted)]">
          Ainda nao existem projetos compativeis cadastrados para este terreno.
        </div>
      )}
    </section>
  );
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-3 last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <strong className={strong ? "text-lg" : ""}>{value}</strong>
    </div>
  );
}
