import Link from "next/link";
import type { Route } from "next";
import { Bath, BedDouble, CheckCircle2, Map, MapPin, Ruler, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { MediaGallery } from "@/components/marketplace/media-gallery";
import { TerrainCard } from "@/components/marketplace/terrain-card";
import { area, money, toNumber } from "@/lib/format";
import { getProject } from "@/services/projects";
import type { Project, Terrain } from "@/types/domain";

function buildSimulationHref(project: Project, terrain: Terrain) {
  const params = new URLSearchParams({
    mode: "FULL",
    terrainId: terrain.id,
    projectId: project.id,
    terrainTitle: terrain.title,
    projectTitle: project.title,
    terrainPrice: String(toNumber(terrain.price)),
    projectPrice: String(toNumber(project.price)),
    buildCost: String(toNumber(project.estimatedBuildCost))
  });

  return `/simulacao?${params.toString()}` as Route;
}

function projectGallery(project: Project) {
  const items = [
    ...(project.images ?? []).map((image, index) => ({
      src: image.url,
      alt: image.altText ?? `${project.title} - imagem ${index + 1}`,
      label: image.isCover ? "Capa" : `Imagem ${index + 1}`
    })),
    project.renderUrl ? { src: project.renderUrl, alt: `Fachada ${project.title}`, label: "Fachada" } : null,
    project.floorPlanUrl ? { src: project.floorPlanUrl, alt: `Planta baixa ${project.title}`, label: "Planta baixa" } : null
  ].filter(Boolean) as Array<{ src: string; alt: string; label?: string }>;

  return items.filter((item, index, all) => all.findIndex((candidate) => candidate.src === item.src) === index);
}

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ terrainId?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const project = await getProject(id);
  const gallery = projectGallery(project);
  const selectedCompatibility = project.compatibilities?.find((compatibility) => compatibility.terrain.id === query.terrainId) ?? null;
  const selectedTerrain = selectedCompatibility?.terrain ?? null;
  const packageTotal = selectedTerrain
    ? toNumber(selectedTerrain.price) + toNumber(project.price) + toNumber(project.estimatedBuildCost)
    : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <MediaGallery items={gallery} title={project.title} />
        <aside className="min-w-0 self-start rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6">
          <p className="break-words text-sm uppercase text-[var(--muted)]">
            {project.style ?? "Projeto"} · {project.architect?.user?.name ?? "Studio parceiro"}
          </p>
          <h1 className="mt-3 break-words text-3xl font-semibold sm:text-4xl">{project.title}</h1>
          <p className="mt-4 break-words leading-7 text-[var(--muted)]">{project.description}</p>
          <div className="mt-6 grid min-w-0 grid-cols-3 gap-3">
            <div className="min-w-0 rounded-[8px] border border-[var(--line)] p-4">
              <BedDouble size={18} />
              <strong className="mt-2 block text-xl">{project.bedrooms}</strong>
            </div>
            <div className="min-w-0 rounded-[8px] border border-[var(--line)] p-4">
              <Bath size={18} />
              <strong className="mt-2 block text-xl">{project.bathrooms}</strong>
            </div>
            <div className="min-w-0 rounded-[8px] border border-[var(--line)] p-4">
              <Ruler size={18} />
              <strong className="mt-2 block truncate text-xl">{area(project.areaM2)}</strong>
            </div>
          </div>
          <div className="mt-6 min-w-0 rounded-[8px] border border-[var(--line)] p-4">
            <p className="text-sm text-[var(--muted)]">Projeto</p>
            <strong className="break-words text-2xl">{money(project.price)}</strong>
            <p className="mt-2 break-words text-sm text-[var(--muted)]">Obra estimada: {money(project.estimatedBuildCost)}</p>
          </div>
          {selectedTerrain ? (
            <div className="mt-4 min-w-0 rounded-[8px] border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] p-4">
              <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                <MapPin className="shrink-0" size={16} />
                Terreno escolhido
              </p>
              <h2 className="mt-2 break-words text-lg font-semibold">{selectedTerrain.title}</h2>
              <p className="mt-1 break-words text-sm text-[var(--muted)]">
                {[selectedTerrain.neighborhood, selectedTerrain.city, selectedTerrain.state].filter(Boolean).join(", ")}
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--muted)]">Terreno</span>
                  <strong>{money(selectedTerrain.price)}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--muted)]">Projeto</span>
                  <strong>{money(project.price)}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[var(--muted)]">Obra estimada</span>
                  <strong>{money(project.estimatedBuildCost)}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-2">
                  <span className="text-[var(--muted)]">Total estimado</span>
                  <strong className="text-lg">{money(packageTotal)}</strong>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {selectedTerrain ? (
              <Link href={buildSimulationHref(project, selectedTerrain)}>
                <Button variant="secondary">
                  <CheckCircle2 size={18} />
                  Selecionar este projeto
                </Button>
              </Link>
            ) : (
              <>
                <div className="w-full rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-4">
                  <p className="text-sm font-semibold text-[var(--accent)]">Compra do projeto em preparacao</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    A compra direta sera liberada com o pacote completo: projeto arquitetonico, estrutural, eletrico,
                    hidraulico e demais itens alinhados com os construtores viabilizadores junto a Caixa.
                  </p>
                </div>
                <Link href="/simulacao">
                  <Button variant="secondary">Simular pacote</Button>
                </Link>
              </>
            )}
            <FavoriteButton targetId={project.id} targetType="project" />
          </div>
        </aside>
      </div>
      <div className="mt-10 min-w-0">
        <div className="mb-5 flex min-w-0 items-center gap-3">
          <Sparkles className="shrink-0 text-[var(--accent)]" size={22} />
          <div className="min-w-0">
            <p className="text-sm uppercase text-[var(--muted)]">Implantacao</p>
            <h2 className="break-words text-2xl font-semibold">Terrenos disponíveis para este projeto</h2>
          </div>
        </div>
        {project.compatibilities?.length ? (
          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            {project.compatibilities.map((compatibility) => (
              <div key={compatibility.id}>
                <TerrainCard terrain={compatibility.terrain} />
                <div className="mt-2 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-3 text-sm">
                  <Link
                    className="inline-flex font-semibold text-[var(--accent)]"
                    href={`/projetos/${project.id}?terrainId=${compatibility.terrain.id}` as Route}
                  >
                    Escolher este terreno
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 text-[var(--muted)]">
            <Map className="mb-3 text-[var(--accent)]" size={22} />
            Ainda não existem terrenos disponíveis para este projeto.
          </div>
        )}
      </div>
    </section>
  );
}
