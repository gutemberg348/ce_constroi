"use client";

import { Map, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTerrains } from "@/hooks/use-terrains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TerrainCard } from "./terrain-card";

export function TerrainBrowser() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [city, setCity] = useState(() => searchParams.get("city") ?? "");
  const [state, setState] = useState(() => (searchParams.get("state") ?? "").toUpperCase());
  const [neighborhood, setNeighborhood] = useState(() => searchParams.get("neighborhood") ?? "");
  const params = useMemo(
    () => ({
      search: search || undefined,
      city: city || undefined,
      state: state || undefined,
      neighborhood: neighborhood || undefined
    }),
    [city, neighborhood, search, state]
  );
  const { data, isLoading } = useTerrains(params);
  const terrains = data?.items ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mb-5 flex min-w-0 flex-col justify-between gap-4 md:mb-6 md:flex-row md:items-end">
        <div className="min-w-0">
          <p className="text-sm uppercase text-[var(--muted)]">Terrenos</p>
          <h1 className="max-w-4xl break-words text-2xl font-semibold sm:text-4xl">
            Terrenos selecionados para transformar seu projeto em realidade.
          </h1>
        </div>
        <div className="grid w-full gap-2 md:max-w-2xl md:grid-cols-[1.4fr_1fr_80px_1fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
            <Input
              className="pl-10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar livre"
              value={search}
            />
          </label>
          <Input onChange={(event) => setCity(event.target.value)} placeholder="Cidade" value={city} />
          <Input maxLength={2} onChange={(event) => setState(event.target.value.toUpperCase())} placeholder="UF" value={state} />
          <Input onChange={(event) => setNeighborhood(event.target.value)} placeholder="Bairro" value={neighborhood} />
        </div>
      </div>
      {isLoading ? (
        <div className="grid min-w-0 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div className="h-72 animate-pulse rounded-[8px] bg-black/5 dark:bg-white/10 md:h-80" key={item} />
          ))}
        </div>
      ) : terrains.length === 0 ? (
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <Map className="mx-auto text-[var(--accent)]" size={34} />
          <h2 className="mt-3 text-2xl font-semibold">Nenhum terreno encontrado</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Tente buscar por outro bairro, cidade ou estado.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              setSearch("");
              setCity("");
              setState("");
              setNeighborhood("");
            }}
            type="button"
            variant="secondary"
          >
            Ver todos os terrenos
          </Button>
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {terrains.map((terrain) => <TerrainCard key={terrain.id} terrain={terrain} />)}
        </div>
      )}
    </section>
  );
}
