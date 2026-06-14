import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Eye,
  Handshake,
  Landmark,
  Lightbulb,
  MapPin,
  Ruler,
  ShieldCheck,
  Target,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Quem Somos",
  description:
    "Conheça o CÊ Constrói, a plataforma que conecta terrenos, projetos, construção e financiamento em uma única jornada."
};

const values = [
  {
    icon: BadgeCheck,
    title: "Transparência",
    description: "Decisões importantes devem ser tomadas com informações claras e confiáveis."
  },
  {
    icon: Lightbulb,
    title: "Inovação",
    description: "Utilizamos tecnologia para simplificar processos tradicionalmente complexos e burocráticos."
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    description: "Buscamos oferecer soluções que proporcionem mais confiança em cada etapa da jornada."
  },
  {
    icon: Handshake,
    title: "Parceria",
    description: "Valorizamos a colaboração entre clientes, corretores, construtoras, loteadoras e instituições financeiras."
  },
  {
    icon: TrendingUp,
    title: "Compromisso com resultados",
    description: "Nosso foco é ajudar cada cliente a encontrar uma solução viável para construir com tranquilidade."
  }
];

const steps = [
  {
    icon: MapPin,
    title: "Escolha o terreno",
    description: "Encontre terrenos disponíveis de acordo com suas necessidades e objetivos."
  },
  {
    icon: Building2,
    title: "Descubra as possibilidades",
    description: "Conheça projetos e soluções construtivas disponíveis para o terreno escolhido."
  },
  {
    icon: Ruler,
    title: "Avalie a viabilidade",
    description: "Entenda custos, possibilidades e condições para transformar seu projeto em realidade."
  },
  {
    icon: Landmark,
    title: "Encontre o financiamento",
    description: "Acesse informações e alternativas que auxiliam na viabilização do investimento."
  }
];

export default function AboutPage() {
  return (
    <>
      <section
        className="border-b border-white/10 bg-[#061733] bg-cover bg-center text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(3,13,34,0.96) 0%, rgba(6,20,45,0.84) 45%, rgba(8,28,62,0.32) 100%), url('/brand/home-hero.png')",
          backgroundPosition: "center right"
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-blue-300">Quem somos</p>
            <h1 className="mt-3 text-5xl font-semibold leading-tight sm:text-6xl">CÊ Constrói</h1>
            <p className="mt-5 text-2xl font-semibold leading-tight sm:text-3xl">
              Construindo conexões para transformar sonhos em realidade.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              Tornamos o processo de construir a casa própria mais fácil, transparente e acessível.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--accent)]">Nossa história</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Uma jornada mais simples para construir.</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-[var(--muted)]">
            <p>
              Sabemos que construir envolve diversas decisões importantes. Encontrar o terreno ideal, escolher o projeto
              adequado, entender os custos da obra e viabilizar o financiamento costumam exigir tempo, conhecimento e a
              participação de vários profissionais e empresas.
            </p>
            <p>
              Foi para simplificar essa jornada que criamos uma plataforma capaz de conectar todas essas etapas em um único
              lugar.
            </p>
            <p>
              Mais do que um portal imobiliário, o CÊ Constrói é uma plataforma inteligente que aproxima pessoas, terrenos,
              projetos, construtoras e soluções financeiras, permitindo que cada cliente encontre a melhor combinação para
              transformar seus planos em realidade.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="border-l-4 border-[var(--accent)] pl-5">
            <Target className="text-[var(--accent)]" size={28} />
            <p className="mt-5 text-sm font-semibold uppercase text-[var(--muted)]">Nossa missão</p>
            <h2 className="mt-2 text-2xl font-semibold">Facilitar o acesso à construção da casa própria.</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              Por meio da tecnologia, conectamos terreno, construção e financiamento em uma experiência simples, segura e
              eficiente.
            </p>
          </div>
          <div className="border-l-4 border-blue-400 pl-5">
            <Eye className="text-blue-500" size={28} />
            <p className="mt-5 text-sm font-semibold uppercase text-[var(--muted)]">Nossa visão</p>
            <h2 className="mt-2 text-2xl font-semibold">Ser a principal plataforma brasileira do setor.</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">
              Queremos integrar terrenos, construção e crédito imobiliário, tornando o sonho da casa própria mais acessível
              para milhares de famílias.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-[var(--accent)]">Nossos valores</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Princípios presentes em cada decisão.</h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {values.map((value) => (
            <article className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5" key={value.title}>
              <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
                <value.icon size={21} />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{value.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-[var(--accent)]">Como funciona</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Do terreno ao financiamento.</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <article className="relative rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-5" key={step.title}>
                <span className="absolute right-4 top-4 text-xs font-semibold text-[var(--muted)]">0{index + 1}</span>
                <step.icon className="text-[var(--accent)]" size={30} />
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--accent)]">O que nos torna diferentes</p>
            <h2 className="mt-2 text-3xl font-semibold">Tudo conectado em uma única experiência.</h2>
            <p className="mt-5 leading-8 text-[var(--muted)]">
              O mercado oferece portais de imóveis, sites de construtoras e plataformas de crédito. O CÊ Constrói vai além
              ao integrar essas etapas, permitindo que o usuário visualize todo o caminho desde a escolha do terreno até a
              aprovação do financiamento.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--accent)]">Nosso compromisso</p>
            <h2 className="mt-2 text-3xl font-semibold">Construir não precisa ser complicado.</h2>
            <p className="mt-5 leading-8 text-[var(--muted)]">
              Trabalhamos para conectar oportunidades, simplificar escolhas e oferecer ferramentas que ajudem você a
              construir com mais segurança, planejamento e confiança.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-6 rounded-[8px] bg-[#0d6efd] p-6 text-white sm:p-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-white/70">CÊ Constrói</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight">
              Da escolha do terreno à aprovação do financiamento.
            </h2>
            <p className="mt-3 text-white/78">Uma única plataforma para transformar seu projeto em realidade.</p>
          </div>
          <Link href="/terrenos">
            <Button className="w-full sm:w-auto" type="button" variant="light">
              Conhecer terrenos
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
