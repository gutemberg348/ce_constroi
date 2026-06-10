"use client";

import { Building2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "./project-card";

export function ProjectBrowser() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");

  const params = useMemo(() => ({ search: search || undefined }), [search]);
  const { data, isLoading } = useProjects(params);
  const projects = data?.items ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Projetos</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Escolha o projeto. Nos conectamos terreno, construcao e financiamento.</h1>
        </div>
        <label className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
          <Input className="pl-10" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por estilo ou nome" value={search} />
        </label>
      </div>
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div className="h-80 animate-pulse rounded-[8px] bg-black/5 dark:bg-white/10" key={item} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <Building2 className="mx-auto text-[var(--accent)]" size={34} />
          <h2 className="mt-3 text-2xl font-semibold">Nenhum projeto encontrado</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            A busca atual nao trouxe projetos disponiveis.
          </p>
          <Button className="mt-5" onClick={() => setSearch("")} type="button" variant="secondary">
            Ver todos os projetos
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </section>
  );
}
