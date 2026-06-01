import { Heart } from "lucide-react";
import { ProjectCard } from "@/components/marketplace/project-card";
import { TerrainCard } from "@/components/marketplace/terrain-card";
import { projectMocks, terrainMocks } from "@/services/mock-data";

export default function FavoritesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Heart className="text-[var(--accent)]" size={26} />
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Favoritos</p>
          <h1 className="text-3xl font-semibold">Sua selecao</h1>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <TerrainCard terrain={terrainMocks[0]} />
        <ProjectCard project={projectMocks[0]} />
      </div>
    </section>
  );
}
