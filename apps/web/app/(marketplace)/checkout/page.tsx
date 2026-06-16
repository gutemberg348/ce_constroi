import Link from "next/link";
import { FileText, Hammer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase text-[var(--accent)]">Atendimento assistido</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight">Compra assistida em preparacao.</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
        Para seguir com terreno, projeto ou pacote completo, a equipe precisa validar documentos, dados tecnicos e
        condicoes comerciais antes de liberar uma compra final.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {[
          {
            icon: FileText,
            title: "Pacote completo",
            text: "A proposta precisa reunir os documentos do terreno e os dados tecnicos antes de liberar uma compra final."
          },
          {
            icon: Hammer,
            title: "Construtor validado",
            text: "O projeto deve estar alinhado com a execucao da obra e com o terreno escolhido."
          },
          {
            icon: ShieldCheck,
            title: "Financiamento seguro",
            text: "A viabilidade passa por analise documental e regras da instituicao financeira."
          }
        ].map(({ icon: Icon, text, title }) => (
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5" key={title}>
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
              <Icon size={21} />
            </div>
            <h2 className="mt-5 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/projetos">
          <Button variant="secondary">Ver projetos</Button>
        </Link>
        <Link href="/simulacao">
          <Button>Simular pacote</Button>
        </Link>
      </div>
    </section>
  );
}
