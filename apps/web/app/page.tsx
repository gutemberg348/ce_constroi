"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Calculator,
  Compass,
  Home,
  Map,
  MapPin,
  MessageCircleMore,
  Ruler,
  Search,
  Sparkles,
  Users
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/marketplace/project-card";
import { TerrainCard } from "@/components/marketplace/terrain-card";
import { TerrainProjectSelector } from "@/components/marketplace/terrain-project-selector";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money, toNumber } from "@/lib/format";
import { getTerrainPhoto } from "@/lib/terrain-images";
import { defaultSiteSettings, getSiteSettings } from "@/services/settings";
import { getProjects } from "@/services/projects";
import { getTerrains } from "@/services/terrains";
import type { LucideIcon } from "lucide-react";
import type { Project, Terrain } from "@/types/domain";

type SearchMode = "terrains" | "projects";

type TerrainFilters = {
  search?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
};

type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    icon: Compass,
    title: "Escolha a regiao",
    description: "Comece por cidade, bairro, rua ou condominio e afine a busca sem ruído."
  },
  {
    icon: Map,
    title: "Veja os lotes",
    description: "Cada card mostra area, faixa de valor e o contexto do terreno de forma direta."
  },
  {
    icon: Building2,
    title: "Abra a casa certa",
    description: "Os projetos compativeis aparecem junto do lote para facilitar a escolha."
  },
  {
    icon: Calculator,
    title: "Simule o pacote",
    description: "Terreno, projeto e obra entram na conta sem chute de valor."
  },
  {
    icon: MessageCircleMore,
    title: "Fale com o time",
    description: "Quando fizer sentido, o fluxo leva o usuario para atendimento humano."
  }
];

const heroBadgeClass =
  "inline-flex items-center gap-2 rounded-[8px] border border-white/18 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/85 backdrop-blur";
const actionLinkClass =
  "focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold transition";
const searchChipClass =
  "focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] border border-white/18 bg-white/10 px-4 text-sm font-semibold text-white/88 transition hover:bg-white/18";

function buildTerrainsHref(filters: TerrainFilters) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.city?.trim()) {
    params.set("city", filters.city.trim());
  }

  if (filters.state?.trim()) {
    params.set("state", filters.state.trim().toUpperCase());
  }

  if (filters.neighborhood?.trim()) {
    params.set("neighborhood", filters.neighborhood.trim());
  }

  return `/terrenos${params.toString() ? `?${params.toString()}` : ""}` as Route;
}

function buildProjectsHref(search?: string) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  return `/projetos${params.toString() ? `?${params.toString()}` : ""}` as Route;
}

function buildSimulationHref(terrain?: Terrain | null, project?: Project | null) {
  if (!terrain || !project) {
    return "/simulacao" as Route;
  }

  const params = new URLSearchParams({
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

function terrainLocation(terrain?: Terrain | null) {
  if (!terrain) {
    return "Catalogo ao vivo";
  }

  return [terrain.address, terrain.neighborhood, terrain.city, terrain.state].filter(Boolean).join(" • ");
}

function StatCard({
  icon: Icon,
  label,
  value,
  note
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
          <Icon size={20} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{note}</span>
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">{label}</p>
      <strong className="mt-1 block text-2xl">{value}</strong>
    </div>
  );
}

function SearchChip({
  icon: Icon,
  label,
  onClick
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={searchChipClass} onClick={onClick} type="button">
      <Icon size={15} />
      {label}
    </button>
  );
}

function FeatureLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[8px] border border-white/18 bg-white/10 px-3 py-2 text-xs font-semibold text-white/88 backdrop-blur">
      <Icon size={14} />
      {text}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<SearchMode>("terrains");
  const [searchText, setSearchText] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchState, setSearchState] = useState("");
  const [searchNeighborhood, setSearchNeighborhood] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings
  });
  const terrainQuery = useQuery({
    queryKey: ["home", "terrains"],
    queryFn: () => getTerrains({ limit: 24 })
  });
  const projectQuery = useQuery({
    queryKey: ["home", "projects"],
    queryFn: () => getProjects({ limit: 8 })
  });

  const settings = settingsQuery.data ?? defaultSiteSettings;
  const terrains = terrainQuery.data?.items ?? [];
  const projects = projectQuery.data?.items ?? [];
  const displayedTerrains = terrains.slice(0, 6);
  const displayedProjects = projects.slice(0, 4);
  const terrainTotal = terrainQuery.data?.meta.total ?? terrains.length;
  const projectTotal = projectQuery.data?.meta.total ?? projects.length;

  const featuredTerrain = terrains.find((terrain) => (terrain.compatibilities?.length ?? 0) > 0) ?? terrains[0] ?? null;
  const featuredCompatibility = featuredTerrain?.compatibilities?.slice().sort((a, b) => toNumber(b.score) - toNumber(a.score))[0] ?? null;
  const featuredProject = featuredCompatibility?.project ?? projects[0] ?? null;
  const packageTotal =
    featuredTerrain && featuredProject
      ? toNumber(featuredTerrain.price) + toNumber(featuredProject.price) + toNumber(featuredProject.estimatedBuildCost)
      : 0;
  const compatibilityTotal = terrains.reduce((total, terrain) => total + (terrain.compatibilities?.length ?? 0), 0);
  const terrainsWithImages = terrains.filter((terrain) => (terrain.images?.length ?? 0) > 0).length;
  const heroImage = featuredTerrain
    ? getTerrainPhoto(featuredTerrain)
    : featuredProject?.images?.[0]?.url ?? featuredProject?.renderUrl ?? "";
  const heroAlt =
    featuredTerrain?.images?.[0]?.altText ??
    featuredTerrain?.title ??
    featuredProject?.images?.[0]?.altText ??
    featuredProject?.title ??
    settings.brandName;
  const heroLocation = terrainLocation(featuredTerrain);
  const featuredCompatibilityScore = featuredCompatibility ? toNumber(featuredCompatibility.score) : 0;
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999").replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Ola, quero ajuda para encontrar terreno, projeto e simulacao."
  )}`;

  function applyTerrainFilters(filters: TerrainFilters) {
    setSearchMode("terrains");
    setSearchText(filters.search ?? "");
    setSearchCity(filters.city ?? "");
    setSearchState(filters.state ?? "");
    setSearchNeighborhood(filters.neighborhood ?? "");
    router.push(buildTerrainsHref(filters));
  }

  function applyProjectSearch(search: string) {
    setSearchMode("projects");
    setSearchText(search);
    setSearchCity("");
    setSearchState("");
    setSearchNeighborhood("");
    router.push(buildProjectsHref(search));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (searchMode === "projects") {
      router.push(buildProjectsHref(searchText));
      return;
    }

    router.push(
      buildTerrainsHref({
        search: searchText,
        city: searchCity,
        state: searchState,
        neighborhood: searchNeighborhood
      })
    );
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        {heroImage ? (
          <PrivacyImage
            alt={heroAlt}
            className="absolute inset-0 h-full w-full object-cover"
            src={heroImage}
          />
        ) : (
          <div className="absolute inset-0 bg-[#0f130f]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,8,0.94),rgba(8,10,8,0.8)_44%,rgba(8,10,8,0.32))]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-12 px-4 py-12 text-white sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className={heroBadgeClass}>
                <BadgeCheck size={14} />
                {settings.brandName}
              </span>
              <span className={heroBadgeClass}>
                <Sparkles size={14} />
                Terreno, projeto e obra
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              Terreno, projeto e simulacao no mesmo lugar.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              Busque por cidade, bairro, rua ou condominio, compare lotes reais, veja projetos compativeis e avance para a simulacao
              sem perder o contexto.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <FeatureLine icon={BadgeCheck} text="Terrenos verificados" />
              <FeatureLine icon={Building2} text="Projetos compativeis" />
              <FeatureLine icon={Calculator} text="Simulacao inteligente" />
              <FeatureLine icon={MessageCircleMore} text="Atendimento humano" />
            </div>

            <div className="mt-8 rounded-[8px] border border-white/18 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  aria-pressed={searchMode === "terrains"}
                  className={`focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] border px-4 text-sm font-semibold transition ${
                    searchMode === "terrains"
                      ? "border-white bg-white text-[#11150f]"
                      : "border-white/18 bg-white/10 text-white/88 hover:bg-white/18"
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
                      : "border-white/18 bg-white/10 text-white/88 hover:bg-white/18"
                  }`}
                  onClick={() => setSearchMode("projects")}
                  type="button"
                >
                  <Building2 size={16} />
                  Projetos
                </button>
                <Link
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] border border-white/18 bg-white/10 px-4 text-sm font-semibold text-white/88 transition hover:bg-white/18"
                  href="/simulacao"
                >
                  <Calculator size={16} />
                  Simulacao
                </Link>
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
                      Encontrar projetos
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,0.45fr)_minmax(0,0.95fr)_auto]">
                    <label className="relative sm:col-span-2 lg:col-span-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                      <input
                        className="focus-ring h-11 w-full rounded-[8px] border border-white/18 bg-white px-3 pl-10 text-sm text-[#11150f] outline-none placeholder:text-[#616861]"
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Cidade, bairro, rua ou condominio"
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
                      Encontrar terrenos
                    </Button>
                  </div>
                )}
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {searchMode === "terrains" ? (
                  <>
                    <SearchChip icon={MapPin} label="Campinas / SP" onClick={() => applyTerrainFilters({ city: "Campinas", state: "SP" })} />
                    <SearchChip icon={MapPin} label="Nova Lima / MG" onClick={() => applyTerrainFilters({ city: "Nova Lima", state: "MG" })} />
                    <SearchChip icon={Compass} label="Condominio fechado" onClick={() => applyTerrainFilters({ search: "condominio" })} />
                    <SearchChip icon={BadgeCheck} label="Bairro planejado" onClick={() => applyTerrainFilters({ search: "bairro planejado" })} />
                  </>
                ) : (
                  <>
                    <SearchChip icon={Home} label="Casa compacta" onClick={() => applyProjectSearch("compacta")} />
                    <SearchChip icon={Sparkles} label="Alto padrao" onClick={() => applyProjectSearch("alto padrao")} />
                    <SearchChip icon={Building2} label="Minimalista" onClick={() => applyProjectSearch("minimalista")} />
                    <SearchChip icon={BadgeCheck} label="Projetos novos" onClick={() => applyProjectSearch("projeto")} />
                  </>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={`${actionLinkClass} bg-white text-[#11150f] hover:bg-white/90`} href="/terrenos">
                <Map size={18} />
                Explorar terrenos
              </Link>
              <Link className={`${actionLinkClass} bg-[#0f766e] text-white hover:bg-[#0d655f] dark:bg-[#2dd4bf] dark:text-[#062522] dark:hover:bg-[#5eead4]`} href="/simulacao">
                <Calculator size={18} />
                Simular agora
              </Link>
              <Link
                className={`${actionLinkClass} border border-white/18 bg-white/10 text-white/88 hover:bg-white/18`}
                href="/anunciar-terreno"
              >
                <Building2 size={18} />
                Anunciar meu terreno
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[8px] border border-white/18 bg-white/10 shadow-2xl backdrop-blur">
              <div className="relative aspect-[4/5]">
                <PrivacyImage
                  alt={heroAlt}
                  className="h-full w-full object-cover"
                  src={heroImage}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(8,10,8,0.08)_52%,rgba(8,10,8,0.92))]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-white/72">
                    <BadgeCheck size={14} />
                    {featuredCompatibility
                      ? `${featuredCompatibilityScore.toFixed(0)}% de compatibilidade`
                      : "Destaque do catalogo"}
                  </div>
                  <h2 className="mt-2 text-3xl font-semibold">{featuredTerrain?.title ?? "Terreno em destaque"}</h2>
                  <p className="mt-2 text-sm text-white/72">{heroLocation}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 px-3 py-2 backdrop-blur">
                      <Ruler size={15} />
                      {featuredTerrain ? area(featuredTerrain.areaM2) : "Area"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 px-3 py-2 backdrop-blur">
                      <Banknote size={15} />
                      {featuredTerrain ? money(featuredTerrain.price) : "Valor"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[8px] border border-white/18 bg-white/10 p-4 text-white/90 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase text-white/60">
                  <Building2 size={14} />
                  Projeto indicado
                </div>
                <strong className="mt-2 block text-lg">{featuredProject?.title ?? "Projeto compativel"}</strong>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/72">
                  {featuredProject?.description ?? "Os projetos compativeis aparecem junto do lote para facilitar a escolha."}
                </p>
              </div>

              <div className="rounded-[8px] border border-white/18 bg-white/10 p-4 text-white/90 backdrop-blur">
                <div className="flex items-center gap-2 text-xs uppercase text-white/60">
                  <Calculator size={14} />
                  Base estimada
                </div>
                <strong className="mt-2 block text-2xl">{packageTotal > 0 ? money(packageTotal) : "Selecione um pacote"}</strong>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Terreno, projeto e obra entram no mesmo fluxo, sem forcar um valor que o cliente nao digitou.
                </p>
                {featuredTerrain && featuredProject ? (
                  <Link
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white"
                    href={buildSimulationHref(featuredTerrain, featuredProject)}
                  >
                    Simular este pacote
                    <ArrowRight size={16} />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[8px] border border-white/18 bg-white/10 p-4 text-white/90 backdrop-blur">
                <p className="text-xs uppercase text-white/60">Terreno</p>
                <strong className="mt-2 block text-lg">{featuredTerrain ? money(featuredTerrain.price) : "--"}</strong>
              </div>
              <div className="rounded-[8px] border border-white/18 bg-white/10 p-4 text-white/90 backdrop-blur">
                <p className="text-xs uppercase text-white/60">Projeto</p>
                <strong className="mt-2 block text-lg">{featuredProject ? money(featuredProject.price) : "--"}</strong>
              </div>
              <div className="rounded-[8px] border border-white/18 bg-white/10 p-4 text-white/90 backdrop-blur">
                <p className="text-xs uppercase text-white/60">Obra</p>
                <strong className="mt-2 block text-lg">{featuredProject ? money(featuredProject.estimatedBuildCost) : "--"}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Prova de valor</p>
              <h2 className="mt-2 text-4xl font-semibold">A home acompanha o catalogo real.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
                Se a base muda, a pagina muda junto. Terrenos, projetos, fotos e compatibilidades saem do banco e entram na tela sem
                numero inventado.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className={`${actionLinkClass} border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10`} href="/terrenos">
                <Map size={18} />
                Ver terrenos
              </Link>
              <Link className={`${actionLinkClass} border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10`} href="/projetos">
                <Building2 size={18} />
                Ver projetos
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Map} label="Terrenos publicados" note="catalogo vivo" value={String(terrainTotal)} />
            <StatCard icon={Building2} label="Projetos publicados" note="casas prontas" value={String(projectTotal)} />
            <StatCard icon={Sparkles} label="Compatibilidades mapeadas" note="lote + projeto" value={String(compatibilityTotal)} />
            <StatCard icon={Users} label="Terrenos com fotos" note="mais contexto" value={String(terrainsWithImages)} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Caminho rapido</p>
            <h2 className="mt-2 text-4xl font-semibold">Em cinco passos o usuario entende o fluxo.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
              A pessoa escolhe a regiao, abre o lote, entende o projeto, simula o pacote e segue para o contato se fizer sentido.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className={`${actionLinkClass} bg-[#0f766e] text-white hover:bg-[#0d655f] dark:bg-[#2dd4bf] dark:text-[#062522] dark:hover:bg-[#5eead4]`} href="/simulacao">
              <Calculator size={18} />
              Ver simulacao
            </Link>
            <Link className={`${actionLinkClass} border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10`} href="/anunciar-terreno">
              <Building2 size={18} />
              Quero anunciar
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step, index) => (
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-5" key={step.title}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                  <step.icon size={20} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_4%,var(--background))]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Visualizacao do projeto</p>
              <h2 className="mt-2 text-4xl font-semibold">Veja o que cabe neste lote.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
                Quando o terreno tem leitura suficiente, a pagina mostra a casa compativel e o pacote estimado sem misturar os passos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm font-semibold">
                <BadgeCheck size={16} />
                Curadoria real
              </span>
              <span className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm font-semibold">
                <Sparkles size={16} />
                Compatibilidade automatica
              </span>
            </div>
          </div>

          {featuredTerrain && featuredTerrain.compatibilities?.length ? (
            <TerrainProjectSelector terrain={featuredTerrain} />
          ) : (
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 text-[var(--muted)]">
              Ainda nao ha um lote com compatibilidade suficiente para abrir a visualizacao 3D.
            </div>
          )}
        </div>
      </section>

      {displayedProjects.length ? (
        <section className="border-b border-[var(--line)] bg-[var(--panel)]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm uppercase text-[var(--muted)]">Projetos em destaque</p>
                <h2 className="text-3xl font-semibold sm:text-4xl">Projetos prontos para combinar com o terreno.</h2>
              </div>
              <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]" href="/projetos">
                Ver todos os projetos
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {displayedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Catalogo de terrenos</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Lotes prontos para receber projeto.</h2>
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]" href="/terrenos">
            Abrir catalogo
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayedTerrains.length ? (
            displayedTerrains.map((terrain) => <TerrainCard key={terrain.id} terrain={terrain} />)
          ) : (
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
              Nenhum terreno cadastrado no banco ainda.
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--background))]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Simulacao</p>
            <h2 className="mt-3 text-4xl font-semibold">Simule sem forcar um valor que o cliente nao digitou.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
              A conta respeita o que foi informado e separa os caminhos: so terreno, terreno + projeto ou pacote completo.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className={`${actionLinkClass} bg-[#11150f] text-white hover:bg-[#273022] dark:bg-white dark:text-[#11150f] dark:hover:bg-white/90`} href="/simulacao">
                <Calculator size={18} />
                Simular agora
              </Link>
              <Link className={`${actionLinkClass} border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10`} href="/anunciar-terreno">
                <Building2 size={18} />
                Anunciar meu terreno
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
              <Calculator className="text-[var(--accent)]" size={20} />
              <strong className="mt-4 block text-lg">So terreno</strong>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Para quem quer comprar o lote primeiro e decidir o resto depois.</p>
            </div>
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
              <Building2 className="text-[var(--accent)]" size={20} />
              <strong className="mt-4 block text-lg">Terreno + projeto</strong>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Para quem quer o lote e a casa certa, sem incluir a obra agora.</p>
            </div>
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
              <Banknote className="text-[var(--accent)]" size={20} />
              <strong className="mt-4 block text-lg">Pacote completo</strong>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Para quem quer terreno, projeto e obra no mesmo fluxo.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Anunciar terreno</p>
            <h2 className="mt-2 text-3xl font-semibold">Tem terreno para anunciar? O fluxo foi feito para isso.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
              Entre como proprietario, preencha os dados, envie as fotos e deixe o admin acompanhar clientes, propostas e aprovacao
              em um painel unico.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className={`${actionLinkClass} bg-[#0f766e] text-white hover:bg-[#0d655f] dark:bg-[#2dd4bf] dark:text-[#062522] dark:hover:bg-[#5eead4]`}
              href="/anunciar-terreno"
            >
              <Building2 size={18} />
              Anunciar meu terreno
            </Link>
            <Link
              className={`${actionLinkClass} border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10`}
              href="/login?next=/anunciar-terreno"
            >
              <Users size={18} />
              Entrar como proprietario
            </Link>
            <Link
              className={`${actionLinkClass} border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10`}
              href={whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircleMore size={18} />
              Falar com o time
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
