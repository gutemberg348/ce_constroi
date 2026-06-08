"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  Compass,
  Map,
  MapPin,
  MessageCircleMore,
  Ruler,
  Search,
  ShieldCheck,
  Users,
  Wallet
} from "lucide-react";
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

export default function HomePage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  const terrainQuery = useQuery({
    queryKey: ["home", "terrains"],
    queryFn: () => getTerrains({ limit: 9 })
  });

  const terrains = terrainQuery.data?.items ?? [];
  const displayedTerrains = terrains.slice(0, 6);
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
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
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
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase text-[var(--accent)]">Exemplo pratico</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">Um terreno, um projeto e uma conta simples.</h2>
              <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">
                O cliente abre o lote, entende qual casa combina com aquela metragem e entra logado para simular se o
                pacote cabe na renda antes de conversar com o time.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className={`${actionLinkClass} bg-[#0f766e] text-white hover:bg-[#0d655f] dark:bg-[#2dd4bf] dark:text-[#062522] dark:hover:bg-[#5eead4]`}
                  href="/terrenos"
                >
                  <Map size={18} />
                  Ver terrenos
                </Link>
                <Link
                  className={`${actionLinkClass} border border-[var(--line)] bg-[var(--background)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10`}
                  href="/login?next=/terrenos"
                >
                  <Calculator size={18} />
                  Simular com login
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch">
                <div className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-5 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                    <MapPin size={20} />
                  </div>
                  <p className="mt-5 text-sm uppercase text-[var(--muted)]">Terreno</p>
                  <h3 className="mt-2 text-2xl font-semibold">Lote 9m x 20m</h3>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                      <dt className="flex items-center gap-2 text-[var(--muted)]">
                        <Ruler size={16} />
                        Area
                      </dt>
                      <dd className="font-semibold">180 m2</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                      <dt className="flex items-center gap-2 text-[var(--muted)]">
                        <Wallet size={16} />
                        Valor
                      </dt>
                      <dd className="font-semibold">R$ 95.000</dd>
                    </div>
                  </dl>
                </div>

                <div className="hidden items-center justify-center text-[var(--accent)] md:flex">
                  <ArrowRight size={24} />
                </div>

                <div className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-5 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                    <Building2 size={20} />
                  </div>
                  <p className="mt-5 text-sm uppercase text-[var(--muted)]">Projeto compativel</p>
                  <h3 className="mt-2 text-2xl font-semibold">Casa Essencial 92</h3>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                      <dt className="text-[var(--muted)]">Area construida</dt>
                      <dd className="font-semibold">92 m2</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                      <dt className="text-[var(--muted)]">Ambientes</dt>
                      <dd className="font-semibold">2 quartos</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="rounded-[8px] border border-[#0f766e]/30 bg-[#0f766e] p-5 text-white shadow-xl shadow-[#0f766e]/12 dark:bg-[#115e59]">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase text-white/76">
                  <Calculator size={17} />
                  Simulacao de renda
                </div>
                <h3 className="mt-3 text-3xl font-semibold leading-tight">Veja se o pacote cabe no bolso antes de selecionar.</h3>
                <p className="mt-3 max-w-2xl leading-7 text-white/76">
                  A simulacao real pede login. Assim o cliente salva o terreno, revisa o projeto e recebe um caminho mais
                  organizado para conversar sobre financiamento.
                </p>
                <dl className="mt-5 grid gap-4 border-t border-white/20 pt-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-white/64">Terreno</dt>
                    <dd className="mt-1 text-xl font-semibold">R$ 95 mil</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-white/64">Projeto + obra</dt>
                    <dd className="mt-1 text-xl font-semibold">R$ 338 mil</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-white/64">Proximo passo</dt>
                    <dd className="mt-1 text-xl font-semibold">Login</dd>
                  </div>
                </dl>
              </div>
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
