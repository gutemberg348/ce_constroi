"use client";

import { Map, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTerrains } from "@/hooks/use-terrains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TerrainCard } from "./terrain-card";

export function TerrainBrowser() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
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
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Terrenos</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Lotes prontos para receber projeto</h1>
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
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div className="h-80 animate-pulse rounded-[8px] bg-black/5 dark:bg-white/10" key={item} />
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
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {terrains.map((terrain) => <TerrainCard key={terrain.id} terrain={terrain} />)}
        </div>
      )}
    </section>
  );
}
