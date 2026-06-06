"use client";

import Link from "next/link";
import { Heart, LogIn } from "lucide-react";
import { ProjectCard } from "@/components/marketplace/project-card";
import { TerrainCard } from "@/components/marketplace/terrain-card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuthStore } from "@/stores/auth-store";

export default function FavoritesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { data: favorites, isLoading } = useFavorites();

  const terrainFavorites = favorites?.filter((favorite) => favorite.terrain) ?? [];
  const projectFavorites = favorites?.filter((favorite) => favorite.project) ?? [];
  const total = terrainFavorites.length + projectFavorites.length;

  if (!accessToken) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <Heart className="mx-auto text-[var(--accent)]" size={38} />
          <h1 className="mt-4 text-3xl font-semibold">Entre para ver seus favoritos</h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
            Seus terrenos e projetos salvos ficam ligados a sua conta.
          </p>
          <Link className="mt-6 inline-flex" href="/login">
            <Button>
              <LogIn size={18} />
              Entrar
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Heart className="text-[var(--accent)]" size={26} />
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Favoritos</p>
          <h1 className="text-3xl font-semibold">Sua selecao</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div className="h-80 animate-pulse rounded-[8px] bg-black/5 dark:bg-white/10" key={item} />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <Heart className="mx-auto text-[var(--accent)]" size={34} />
          <h2 className="mt-3 text-2xl font-semibold">Nada salvo ainda</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Use o coracao nos cards de terrenos e projetos para montar sua selecao.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/terrenos">
              <Button variant="secondary">Ver terrenos</Button>
            </Link>
            <Link href="/projetos">
              <Button variant="ghost">Ver projetos</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {terrainFavorites.length ? (
            <div>
              <h2 className="mb-4 text-2xl font-semibold">Terrenos</h2>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {terrainFavorites.map((favorite) =>
                  favorite.terrain ? <TerrainCard key={favorite.id} terrain={favorite.terrain} /> : null
                )}
              </div>
            </div>
          ) : null}

          {projectFavorites.length ? (
            <div>
              <h2 className="mb-4 text-2xl font-semibold">Projetos</h2>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {projectFavorites.map((favorite) =>
                  favorite.project ? <ProjectCard key={favorite.id} project={favorite.project} /> : null
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
