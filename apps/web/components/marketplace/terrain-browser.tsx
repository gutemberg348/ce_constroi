"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTerrains } from "@/hooks/use-terrains";
import { Input } from "@/components/ui/input";
import { TerrainCard } from "./terrain-card";

export function TerrainBrowser() {
  const [search, setSearch] = useState("");
  const params = useMemo(() => ({ search: search || undefined }), [search]);
  const { data, isLoading } = useTerrains(params);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Terrenos</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Lotes prontos para receber projeto</h1>
        </div>
        <label className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
          <Input className="pl-10" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cidade ou nome" value={search} />
        </label>
      </div>
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div className="h-80 animate-pulse rounded-[8px] bg-black/5 dark:bg-white/10" key={item} />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((terrain) => <TerrainCard key={terrain.id} terrain={terrain} />)}
        </div>
      )}
    </section>
  );
}
