"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Building2, Compass, Map, MapPin, MessageCircleMore, Search, ShieldCheck, Users } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { TerrainCard } from "@/components/marketplace/terrain-card";
import { getTerrains } from "@/services/terrains";
import type { LucideIcon } from "lucide-react";

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
    title: "Comece pela localizacao",
    description: "Digite cidade, bairro ou regiao. A home leva voce para o catalogo de terrenos com a busca aplicada."
  },
  {
    icon: Map,
    title: "Entenda o terreno",
    description: "Na pagina do lote voce confere fotos, medidas, valor, endereco e informacoes importantes antes de falar com alguem."
  },
  {
    icon: MessageCircleMore,
    title: "Veja o projeto certo",
    description: "Quando houver projeto compativel, ele aparece dentro do terreno para abrir detalhes e escolher com calma."
  }
];

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

function HeroAction({
  icon: Icon,
  title,
  description,
  href
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: Route;
}) {
  return (
    <Link
      className="focus-ring group rounded-[8px] border border-white/18 bg-white/10 p-5 text-white/90 backdrop-blur transition hover:bg-white/16"
      href={href}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-white text-[#11150f]">
          <Icon size={20} />
        </div>
        <ArrowRight className="text-white/60 transition group-hover:translate-x-1 group-hover:text-white" size={18} />
      </div>
      <strong className="mt-5 block text-xl">{title}</strong>
      <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  const terrainQuery = useQuery({
    queryKey: ["home", "terrains"],
    queryFn: () => getTerrains({ limit: 9 })
  });

  const terrains = terrainQuery.data?.items ?? [];
  const displayedTerrains = terrains.slice(0, 6);
  const terrainTotal = terrainQuery.data?.meta.total ?? terrains.length;
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999").replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Ola, quero ajuda para encontrar um terreno."
  )}`;

  function applyTerrainFilters(filters: TerrainFilters) {
    setSearchText([filters.search, filters.neighborhood, filters.city, filters.state].filter(Boolean).join(" / "));
    router.push(buildTerrainsHref(filters));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildTerrainsHref({ search: searchText }));
  }

  return (
    <>
      <section
        className="border-b border-[var(--line)] bg-[#11150f] bg-cover bg-center text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(8,10,8,0.96), rgba(8,10,8,0.84) 42%, rgba(8,10,8,0.32)), url('/brand/home-hero.png')"
        }}
      >
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-[8px] border border-white/18 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/85">
              <BadgeCheck size={14} />
              Terreno + projeto em um caminho claro
            </span>

            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
              Ache o terreno certo e entenda o que pode ser construido nele.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              Comece pela localizacao. Depois abra cada lote para ver fotos, medidas, valor e, quando existir, projetos
              compativeis para analisar antes de escolher.
            </p>

            <form
              className="mt-8 max-w-2xl rounded-[8px] border border-white/18 bg-white/10 p-4 shadow-2xl backdrop-blur-md"
              onSubmit={submitSearch}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-white/66">Buscar sua localizacao</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                  <input
                    className="focus-ring h-11 w-full rounded-[8px] border border-white/18 bg-white px-3 pl-10 text-sm text-[#11150f] outline-none placeholder:text-[#616861]"
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Digite cidade, bairro ou regiao"
                    value={searchText}
                  />
                </label>
                <Button type="submit" variant="light">
                  Buscar terrenos
                </Button>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Voce vai para a pagina de terrenos, onde pode filtrar melhor e abrir o lote completo.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <SearchChip icon={MapPin} label="Campinas / SP" onClick={() => applyTerrainFilters({ city: "Campinas", state: "SP" })} />
                <SearchChip icon={MapPin} label="Nova Lima / MG" onClick={() => applyTerrainFilters({ city: "Nova Lima", state: "MG" })} />
                <SearchChip icon={Compass} label="Condominio fechado" onClick={() => applyTerrainFilters({ search: "condominio" })} />
                <SearchChip icon={ShieldCheck} label="Terrenos verificados" onClick={() => applyTerrainFilters({ search: "verificado" })} />
              </div>
            </form>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={`${actionLinkClass} bg-white text-[#11150f] hover:bg-white/90`} href="/terrenos">
                <Map size={18} />
                Ver terrenos
              </Link>
              <Link
                className={`${actionLinkClass} border border-white/18 bg-white/10 text-white/88 hover:bg-white/18`}
                href="/anunciar-terreno"
              >
                <Building2 size={18} />
                Anunciar terreno
              </Link>
              <a
                className={`${actionLinkClass} border border-white/18 bg-white/10 text-white/88 hover:bg-white/18`}
                href={whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircleMore size={18} />
                Falar com o time
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[8px] border border-white/18 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm uppercase text-white/60">Exemplo pratico</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">O cliente entende primeiro, escolhe depois.</h2>
              <div className="mt-6 divide-y divide-white/12 border-y border-white/12">
                <div className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr]">
                  <strong className="text-white">Terreno</strong>
                  <p className="text-sm leading-6 text-white/70">Localizacao, fotos, medidas, valor e dados do lote em uma pagina propria.</p>
                </div>
                <div className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr]">
                  <strong className="text-white">Projeto</strong>
                  <p className="text-sm leading-6 text-white/70">
                    Quando o arquiteto vincula um projeto ao lote, o cliente abre os detalhes antes de selecionar.
                  </p>
                </div>
                <div className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr]">
                  <strong className="text-white">Atendimento</strong>
                  <p className="text-sm leading-6 text-white/70">Depois de entender o lote, ele pode pedir ajuda, visita ou proposta.</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-4 rounded-[8px] bg-white/10 px-4 py-3 text-sm text-white/74">
                <span>Catalogo em movimento</span>
                <strong className="text-xl text-white">{terrainQuery.isLoading ? "..." : terrainTotal}</strong>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <HeroAction
                description="Abra a lista completa e filtre por localizacao."
                href="/terrenos"
                icon={Map}
                title="Comprar terreno"
              />
              <HeroAction
                description="Envie os dados do lote para avaliacao."
                href="/anunciar-terreno"
                icon={Building2}
                title="Anunciar terreno"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Catalogo</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Alguns terrenos para comecar.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
              A lista completa fica em terrenos. Aqui entram apenas alguns lotes recentes para o cliente sentir o tipo de
              informacao que vai encontrar.
            </p>
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]" href="/terrenos">
            Abrir catalogo
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {terrainQuery.isLoading ? (
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
              Carregando terrenos...
            </div>
          ) : displayedTerrains.length ? (
            displayedTerrains.map((terrain) => <TerrainCard key={terrain.id} terrain={terrain} />)
          ) : (
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
              Nenhum terreno cadastrado no banco ainda.
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm uppercase text-[var(--muted)]">Como funciona</p>
            <h2 className="mt-2 text-4xl font-semibold">Terreno primeiro. Projeto depois.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
              O cliente nao precisa adivinhar. Ele parte da regiao, entende o lote e so entao ve os projetos compativeis
              dentro da pagina do terreno.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Anunciar terreno</p>
            <h2 className="mt-2 text-3xl font-semibold">Tem terreno para anunciar?</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
              Envie as informacoes do lote, fotos e medidas. O time avalia os dados e coloca o terreno no fluxo certo do
              catalogo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className={`${actionLinkClass} bg-[#0f766e] text-white hover:bg-[#0d655f] dark:bg-[#2dd4bf] dark:text-[#062522] dark:hover:bg-[#5eead4]`}
              href="/anunciar-terreno"
            >
              <Building2 size={18} />
              Anunciar terreno
            </Link>
            <Link
              className={`${actionLinkClass} border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10`}
              href="/login?next=/anunciar-terreno"
            >
              <Users size={18} />
              Entrar
            </Link>
            <a
              className={`${actionLinkClass} border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10`}
              href={whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircleMore size={18} />
              Falar com o time
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
