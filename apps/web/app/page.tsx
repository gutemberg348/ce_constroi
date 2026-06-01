import Link from "next/link";
import { ArrowRight, Banknote, Building2, CheckCircle2, ClipboardCheck, Hammer, Map, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerrainCard } from "@/components/marketplace/terrain-card";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money, toNumber } from "@/lib/format";
import { projectMocks, terrainMocks } from "@/services/mock-data";

const steps = [
  {
    icon: Map,
    kicker: "Passo 1",
    title: "Escolha seu terreno",
    description: "Veja localizacao, metragem, frente, profundidade e valor antes de montar o pacote."
  },
  {
    icon: Building2,
    kicker: "Passo 2",
    title: "Monte seu imovel",
    description: "O sistema mostra apenas projetos que cabem nas medidas do lote escolhido."
  },
  {
    icon: ClipboardCheck,
    kicker: "Passo 3",
    title: "Simule e siga com atendimento",
    description: "A pre-analise organiza renda, entrada e pacote para validar depois nos canais oficiais."
  }
];

const featuredTerrain = terrainMocks[0];
const featuredProject = featuredTerrain.compatibilities?.[0]?.project ?? projectMocks[0];
const packageTotal =
  toNumber(featuredTerrain.price) + toNumber(featuredProject.price) + toNumber(featuredProject.estimatedBuildCost);

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <PrivacyImage
          alt="Casa contemporanea de alto padrao"
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1900&q=86"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,8,0.92),rgba(8,10,8,0.7)_46%,rgba(8,10,8,0.22))]" />

        <div className="relative mx-auto grid min-h-[calc(92vh-4rem)] max-w-7xl gap-10 px-4 py-12 text-white sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase text-[#9ee4d8]">Ce constroi</p>
            <h1 className="text-5xl font-semibold leading-[1.03] sm:text-6xl lg:text-7xl">Monte sua casa em 3 passos.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/78">
              O cliente escolhe o terreno, ve as casas que cabem nele e sai com uma base para atendimento.
            </p>
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

            <div className="flex flex-wrap gap-3 pt-2">
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
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Fluxo principal</p>
            <h2 className="mt-3 text-4xl font-semibold">A venda comeca pelo encaixe tecnico.</h2>
            <p className="mt-4 leading-7 text-[var(--muted)]">
              A base do projeto e simples: terreno com medida cadastrada, projeto com medida minima e pacote com custo
              estimado de obra. O cliente entende antes de falar com atendimento.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Projeto aparece quando largura minima e profundidade cabem no lote.",
              "Pacote mostra terreno, projeto, obra estimada e total comercial.",
              "Terreno e pacote completo seguem para fechamento assistido.",
              "Somente projeto pode ir direto para checkout da plataforma."
            ].map((item) => (
              <div className="flex gap-3 rounded-[8px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_4%,var(--panel))] p-4" key={item}>
                <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--accent)]" size={19} />
                <p className="text-sm leading-6 text-[var(--muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              src={featuredTerrain.images?.[0]?.url ?? "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"}
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
                src={featuredProject.images?.[0]?.url ?? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"}
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
          {terrainMocks.map((terrain) => (
            <TerrainCard key={terrain.id} terrain={terrain} />
          ))}
        </div>
      </section>
    </>
  );
}
