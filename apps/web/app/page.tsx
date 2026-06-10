"use client";

import Image from "next/image";
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
    title: "Escolha do terreno",
    description: "Encontre o lote pela regiao, veja fotos, medidas e valor antes de seguir."
  },
  {
    icon: Map,
    title: "Projeto da casa",
    description: "Abra os projetos compativeis com aquele terreno e escolha o modelo ideal."
  },
  {
    icon: Building2,
    title: "Construcao da casa",
    description: "Veja o pacote de projeto e obra para entender o caminho completo."
  },
  {
    icon: ShieldCheck,
    title: "Aprovacao do financiamento",
    description: "Simule com login e avance para atendimento quando fizer sentido para sua renda."
  }
];

const actionLinkClass =
  "focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold transition";
const searchChipClass =
  "focus-ring inline-flex h-9 items-center gap-2 rounded-[8px] border border-white/18 bg-white/10 px-3 text-xs font-semibold text-white/88 transition hover:bg-white/18";

const citySuggestions = [
  "Campinas, SP",
  "Nova Lima, MG",
  "Fortaleza, CE",
  "Eusebio, CE",
  "Sao Paulo, SP",
  "Ribeirao Preto, SP",
  "Belo Horizonte, MG",
  "Curitiba, PR"
];

const exampleImages = {
  terrain: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=85",
  project: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85"
};

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
              Da escolha do terreno a aprovacao do financiamento.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              Uma unica plataforma para transformar seu projeto em realidade.
            </p>

            <form
              className="mt-7 max-w-xl rounded-[8px] border border-white/18 bg-white/10 p-3 shadow-2xl backdrop-blur-md"
              onSubmit={submitSearch}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-white/66">Buscar sua localizacao</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                  <input
                    autoComplete="address-level2"
                    className="focus-ring h-10 w-full rounded-[8px] border border-white/18 bg-white px-3 pl-10 text-sm text-[#11150f] outline-none placeholder:text-[#616861]"
                    list="home-city-suggestions"
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Cidade, bairro ou regiao"
                    value={searchText}
                  />
                  <datalist id="home-city-suggestions">
                    {citySuggestions.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </label>
                <Button className="h-10 px-3" type="submit" variant="light">
                  Buscar terrenos
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <SearchChip icon={MapPin} label="Buscar por cidade" onClick={() => applyTerrainFilters({ search: searchText })} />
                <SearchChip icon={Compass} label="Ver terrenos publicados" onClick={() => router.push("/terrenos")} />
                <SearchChip icon={ShieldCheck} label="Projetos compativeis" onClick={() => applyTerrainFilters({ search: "projeto" })} />
              </div>
            </form>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={`${actionLinkClass} bg-[#0f766e] text-white hover:bg-[#0d655f]`} href="/terrenos">
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
                Falar com especialista
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
              <h2 className="mt-3 text-4xl font-semibold leading-tight">Um terreno, um projeto e um sonho realizado.</h2>
              <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">
                O cliente encontra o lote, escolhe qual casa combina com seus sonhos e se cadastra para simular se tudo
                cabe na renda. A qualquer momento, pode solicitar ajuda de um especialista.
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
                <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--background)] shadow-sm">
                  <Image
                    alt="Exemplo de terreno disponivel para compra"
                    className="h-36 w-full object-cover"
                    height={360}
                    src={exampleImages.terrain}
                    width={640}
                  />
                  <div className="p-5">
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
                </div>

                <div className="hidden items-center justify-center text-[var(--accent)] md:flex">
                  <ArrowRight size={24} />
                </div>

                <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--background)] shadow-sm">
                  <Image
                    alt="Exemplo de projeto de casa compativel"
                    className="h-36 w-full object-cover"
                    height={360}
                    src={exampleImages.project}
                    width={640}
                  />
                  <div className="p-5">
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
              </div>

              <div className="rounded-[8px] border border-[#0f766e]/30 bg-[#0f766e] p-5 text-white shadow-xl shadow-[#0f766e]/12 dark:bg-[#115e59]">
                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                  <div className="relative h-24 overflow-hidden rounded-[8px] border border-white/20">
                    <Image
                      alt="Miniatura do terreno selecionado na simulacao"
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 50vw, 240px"
                      src={exampleImages.terrain}
                    />
                    <span className="absolute bottom-2 left-2 rounded-[8px] bg-black/55 px-2 py-1 text-xs font-semibold">
                      Terreno selecionado
                    </span>
                  </div>
                  <div className="relative h-24 overflow-hidden rounded-[8px] border border-white/20">
                    <Image
                      alt="Miniatura do projeto selecionado na simulacao"
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 50vw, 240px"
                      src={exampleImages.project}
                    />
                    <span className="absolute bottom-2 left-2 rounded-[8px] bg-black/55 px-2 py-1 text-xs font-semibold">
                      Projeto escolhido
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase text-white/76">
                  <Calculator size={17} />
                  Simulacao de renda
                </div>
                <h3 className="mt-3 text-3xl font-semibold leading-tight">Descubra se o plano cabe na sua renda antes de avancar.</h3>
                <p className="mt-3 max-w-2xl leading-7 text-white/76">
                  A simulacao pede login para salvar terreno e projeto. Depois, o atendimento ajuda a conferir renda,
                  documentos e proximos passos.
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
            <h2 className="text-3xl font-semibold sm:text-4xl">Terrenos em destaque.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
              Veja alguns lotes publicados e abra a pagina do terreno para analisar fotos, medidas, valor e projetos
              compativeis.
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

          <div className="grid gap-4 md:grid-cols-4">
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
              Falar com especialista
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
