import Link from "next/link";
import { Bath, BedDouble, Map, Ruler, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { TerrainCard } from "@/components/marketplace/terrain-card";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money, toNumber } from "@/lib/format";
import { getProject } from "@/services/projects";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  const image = project.images?.[0]?.url ?? project.renderUrl;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)]">
          {image ? <PrivacyImage alt={project.title} className="h-[520px] w-full object-cover" src={image} /> : null}
        </div>
        <aside className="self-start rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6">
          <p className="text-sm uppercase text-[var(--muted)]">
            {project.style ?? "Projeto"} · {project.architect?.user?.name ?? "Studio parceiro"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold">{project.title}</h1>
          <p className="mt-4 leading-7 text-[var(--muted)]">{project.description}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-[8px] border border-[var(--line)] p-4">
              <BedDouble size={18} />
              <strong className="mt-2 block text-xl">{project.bedrooms}</strong>
            </div>
            <div className="rounded-[8px] border border-[var(--line)] p-4">
              <Bath size={18} />
              <strong className="mt-2 block text-xl">{project.bathrooms}</strong>
            </div>
            <div className="rounded-[8px] border border-[var(--line)] p-4">
              <Ruler size={18} />
              <strong className="mt-2 block text-xl">{area(project.areaM2)}</strong>
            </div>
          </div>
          <div className="mt-6 rounded-[8px] border border-[var(--line)] p-4">
            <p className="text-sm text-[var(--muted)]">Projeto</p>
            <strong className="text-2xl">{money(project.price)}</strong>
            <p className="mt-2 text-sm text-[var(--muted)]">Obra estimada: {money(project.estimatedBuildCost)}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/checkout">
              <Button>Comprar projeto</Button>
            </Link>
            <Link href="/simulacao">
              <Button variant="secondary">Simular pacote</Button>
            </Link>
            <FavoriteButton targetId={project.id} targetType="project" />
          </div>
        </aside>
      </div>
      <div className="mt-10">
        <div className="mb-5 flex items-center gap-3">
          <Sparkles className="text-[var(--accent)]" size={22} />
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Implantacao</p>
            <h2 className="text-2xl font-semibold">Terrenos onde esta casa encaixa</h2>
          </div>
        </div>
        {project.compatibilities?.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {project.compatibilities.map((compatibility) => (
              <div key={compatibility.id}>
                <TerrainCard terrain={compatibility.terrain} />
                <div className="mt-2 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-3 text-sm text-[var(--muted)]">
                  Score {toNumber(compatibility.score).toFixed(0)}% - {compatibility.notes ?? "Terreno compativel."}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 text-[var(--muted)]">
            <Map className="mb-3 text-[var(--accent)]" size={22} />
            Ainda nao existem terrenos compativeis cadastrados para este projeto.
          </div>
        )}
      </div>
    </section>
  );
}
