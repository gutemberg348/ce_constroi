import { CreditCard, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase text-[var(--muted)]">Checkout</p>
      <h1 className="mt-3 text-4xl font-semibold">Pagamento com split e contrato.</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-[1fr_360px]">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
          {[
            ["Terreno Reserva Aldeia", "R$ 620.000"],
            ["Projeto Casa Aurora", "R$ 42.000"],
            ["Taxas operacionais", "R$ 23.170"]
          ].map(([label, value]) => (
            <div className="flex justify-between gap-4 border-b border-[var(--line)] py-4 last:border-0" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <aside className="rounded-[8px] border border-[var(--line)] bg-[#11150f] p-6 text-white dark:bg-white dark:text-[#11150f]">
          <CreditCard size={28} />
          <p className="mt-8 text-sm opacity-75">Total</p>
          <strong className="text-4xl">R$ 685.170</strong>
          <div className="mt-8 space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <ShieldCheck size={17} />
              Split preparado
            </p>
            <p className="flex items-center gap-2">
              <FileText size={17} />
              Contrato automatico
            </p>
          </div>
          <Button className="mt-8 w-full bg-[var(--background)] text-[var(--foreground)]" type="button">
            Confirmar pagamento
          </Button>
        </aside>
      </div>
    </section>
  );
}
