"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Banknote, Building2, CheckCircle2, ClipboardCheck, Hammer, Map, Ruler, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { TerrainCard } from "@/components/marketplace/terrain-card";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money, toNumber } from "@/lib/format";
import { getTerrainPhoto } from "@/lib/terrain-images";
import { getTerrains } from "@/services/terrains";

const steps = [
  {
    icon: Map,
    kicker: "Passo 1",
    title: "Ache o lote",
    description: "Busque por cidade, bairro e faixa de valor antes de avancar."
  },
  {
    icon: Building2,
    kicker: "Passo 2",
    title: "Veja o que cabe",
    description: "O catalogo mostra terreno, terreno + projeto e pacote completo na ordem certa."
  },
  {
    icon: ClipboardCheck,
    kicker: "Passo 3",
    title: "Feche com atendimento",
    description: "A base comercial segue pronta para analise humana e validacao oficial."
  }
];

export default function HomePage() {
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<"terrains" | "projects">("terrains");
  const [searchText, setSearchText] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchState, setSearchState] = useState("");
  const [searchNeighborhood, setSearchNeighborhood] = useState("");

  const terrainQuery = useQuery({
    queryKey: ["home", "terrains"],
    queryFn: () => getTerrains({ limit: 10 })
  });
  const terrains = terrainQuery.data?.items ?? [];
  const featuredTerrain = terrains[0];
  const featuredProject = featuredTerrain?.compatibilities?.[0]?.project;
  const heroImage =
    featuredTerrain?.images?.[0]?.url ??
    featuredProject?.images?.[0]?.url ??
    featuredProject?.renderUrl ??
    "/brand/logo-light.svg";
  const packageTotal =
    toNumber(featuredTerrain?.price) + toNumber(featuredProject?.price) + toNumber(featuredProject?.estimatedBuildCost);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (searchMode === "projects") {
      const params = new URLSearchParams();
      if (searchText.trim()) {
        params.set("search", searchText.trim());
      }
      router.push(`/projetos${params.toString() ? `?${params.toString()}` : ""}`);
      return;
    }

    const params = new URLSearchParams();
    if (searchText.trim()) {
      params.set("search", searchText.trim());
    }
    if (searchCity.trim()) {
      params.set("city", searchCity.trim());
    }
    if (searchState.trim()) {
      params.set("state", searchState.trim().toUpperCase());
    }
    if (searchNeighborhood.trim()) {
      params.set("neighborhood", searchNeighborhood.trim());
    }

    router.push(`/terrenos${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <>
      <section className="relative overflow-hidden">
        <PrivacyImage
          alt={featuredTerrain?.images?.[0]?.altText ?? featuredTerrain?.title ?? featuredProject?.title ?? "Ce constroi"}
          className="absolute inset-0 h-full w-full object-cover"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,8,0.92),rgba(8,10,8,0.7)_46%,rgba(8,10,8,0.22))]" />

        <div className="relative mx-auto grid min-h-[calc(92vh-4rem)] max-w-7xl gap-10 px-4 py-12 text-white sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase text-[#9ee4d8]">Catalogo ao vivo</p>
            <h1 className="text-5xl font-semibold leading-[1.03] sm:text-6xl lg:text-7xl">Terreno, projeto e obra no mesmo fluxo.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/78">
              Busque por cidade, bairro ou estilo e veja o que cabe no lote antes de falar com atendimento.
            </p>

            <div className="mt-8 max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <button
                  aria-pressed={searchMode === "terrains"}
                  className={`focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] border px-4 text-sm font-semibold transition ${
                    searchMode === "terrains"
                      ? "border-white bg-white text-[#11150f]"
                      : "border-white/24 bg-white/10 text-white hover:bg-white/15"
                  }`}
                  onClick={() => setSearchMode("terrains")}
                  type="button"
                >
                  <Map size={16} />
                  Terrenos
                </button>
                <button
                  aria-pressed={searchMode === "projects"}
                  className={`focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] border px-4 text-sm font-semibold transition ${
                    searchMode === "projects"
                      ? "border-white bg-white text-[#11150f]"
                      : "border-white/24 bg-white/10 text-white hover:bg-white/15"
                  }`}
                  onClick={() => setSearchMode("projects")}
                  type="button"
                >
                  <Building2 size={16} />
                  Projetos
                </button>
              </div>

              <form className="mt-4 grid gap-3" onSubmit={submitSearch}>
                {searchMode === "projects" ? (
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <label className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                      <input
                        className="focus-ring h-11 w-full rounded-[8px] border border-white/18 bg-white px-3 pl-10 text-sm text-[#11150f] outline-none placeholder:text-[#616861]"
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Nome, estilo ou descricao"
                        value={searchText}
                      />
                    </label>
                    <Button className="w-full" type="submit" variant="light">
                      Buscar projetos
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,0.45fr)_minmax(0,0.95fr)_auto]">
                    <label className="relative sm:col-span-2 lg:col-span-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                      <input
                        className="focus-ring h-11 w-full rounded-[8px] border border-white/18 bg-white px-3 pl-10 text-sm text-[#11150f] outline-none placeholder:text-[#616861]"
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Terreno, rua, cidade ou bairro"
                        value={searchText}
                      />
                    </label>
                    <input
                      className="focus-ring h-11 w-full rounded-[8px] border border-white/18 bg-white px-3 text-sm text-[#11150f] outline-none placeholder:text-[#616861]"
                      onChange={(event) => setSearchCity(event.target.value)}
                      placeholder="Cidade"
                      value={searchCity}
                    />
                    <input
                      className="focus-ring h-11 w-full rounded-[8px] border border-white/18 bg-white px-3 text-sm text-[#11150f] outline-none placeholder:text-[#616861]"
                      maxLength={2}
                      onChange={(event) => setSearchState(event.target.value.toUpperCase())}
                      placeholder="UF"
                      value={searchState}
                    />
                    <input
                      className="focus-ring h-11 w-full rounded-[8px] border border-white/18 bg-white px-3 text-sm text-[#11150f] outline-none placeholder:text-[#616861]"
                      onChange={(event) => setSearchNeighborhood(event.target.value)}
                      placeholder="Bairro"
                      value={searchNeighborhood}
                    />
                    <Button className="sm:col-span-2 lg:col-span-1" type="submit" variant="light">
                      Buscar terrenos
                    </Button>
                  </div>
                )}
              </form>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/terrenos">
                <Button variant="light">
                  <Map size={18} />
                  Comecar pelo terreno
                </Button>
              </Link>
              <Link href="/projetos">
                <Button variant="secondary">
                  <Hammer size={18} />
                  Ver casas prontas
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div
                className="grid gap-4 rounded-[8px] border border-white/18 bg-white/12 p-5 shadow-2xl backdrop-blur-md md:grid-cols-[72px_1fr] md:items-center"
                key={step.title}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-white text-[#11150f]">
                  <step.icon size={28} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-[#9ee4d8]">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/72">{step.description}</p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Fluxo principal</p>
            <h2 className="mt-3 text-4xl font-semibold">A venda comeca pela faixa certa.</h2>
            <p className="mt-4 leading-7 text-[var(--muted)]">
              O sistema tenta primeiro terreno, depois terreno + projeto e por fim o pacote completo. Se a escolha passar
              da base, a recomendacao volta uma faixa sem inventar valor.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "So terreno, terreno + projeto ou pacote completo, nessa ordem.",
              "A faixa que cabe aparece antes da que estoura a base.",
              "Cidade, bairro e estado ajudam a achar lote rapido.",
              "Depois do filtro inicial, o atendimento faz a analise oficial."
            ].map((item) => (
              <div className="flex gap-3 rounded-[8px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_4%,var(--panel))] p-4" key={item}>
                <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--accent)]" size={19} />
                <p className="text-sm leading-6 text-[var(--muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featuredTerrain && featuredProject ? (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Pacote em destaque</p>
              <h2 className="mt-2 text-4xl font-semibold">Veja o lote, escolha a casa e avance.</h2>
            </div>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]" href={`/terrenos/${featuredTerrain.id}`}>
              Abrir montagem <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[420px]">
              <PrivacyImage
                alt={featuredTerrain.images?.[0]?.altText ?? featuredTerrain.title}
                className="absolute inset-0 h-full w-full object-cover"
                src={getTerrainPhoto(featuredTerrain)}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(8,10,8,0.74))]" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-sm uppercase text-white/72">{featuredTerrain.city}, {featuredTerrain.state}</p>
                <h3 className="mt-2 text-3xl font-semibold">{featuredTerrain.title}</h3>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-[8px] bg-white/12 px-3 py-2 backdrop-blur">
                    <Ruler size={16} />
                    {area(featuredTerrain.areaM2)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-[8px] bg-white/12 px-3 py-2 backdrop-blur">
                    <Banknote size={16} />
                    {money(featuredTerrain.price)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6">
              <div className="overflow-hidden rounded-[8px] border border-[var(--line)]">
                <PrivacyImage
                  alt={featuredProject.images?.[0]?.altText ?? featuredProject.title}
                  className="h-64 w-full object-cover"
                  src={featuredProject.images?.[0]?.url ?? featuredProject.renderUrl ?? "/brand/logo-light.svg"}
                />
              </div>

              <div>
                <p className="text-sm uppercase text-[var(--muted)]">Projeto compativel</p>
                <h3 className="mt-2 text-3xl font-semibold">{featuredProject.title}</h3>
                <p className="mt-3 leading-7 text-[var(--muted)]">{featuredProject.description}</p>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <span className="rounded-[8px] border border-[var(--line)] px-3 py-2">Projeto {money(featuredProject.price)}</span>
                <span className="rounded-[8px] border border-[var(--line)] px-3 py-2">Obra {money(featuredProject.estimatedBuildCost)}</span>
                <span className="rounded-[8px] border border-[var(--line)] px-3 py-2">Total {money(packageTotal)}</span>
              </div>

              <Link href={`/terrenos/${featuredTerrain.id}#monte-sua-casa`}>
                <Button className="w-full" type="button">
                  Montar este pacote
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-y border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--background))]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Simulacao</p>
            <h2 className="mt-3 text-4xl font-semibold">Pre-analise para decidir, nao promessa de banco.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {["Renda e entrada", "Valor do pacote", "Atendimento CAIXA"].map((item) => (
              <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5" key={item}>
                <CheckCircle2 className="text-[var(--accent)]" size={20} />
                <strong className="mt-4 block">{item}</strong>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Referencia comercial para orientar o proximo passo com validacao oficial.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Catalogo</p>
            <h2 className="text-3xl font-semibold">Terrenos em destaque</h2>
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]" href="/terrenos">
            Todos <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {terrains.length ? (
            terrains.map((terrain) => <TerrainCard key={terrain.id} terrain={terrain} />)
          ) : (
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
              Nenhum terreno cadastrado no banco ainda.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
