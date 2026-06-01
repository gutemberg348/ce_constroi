import Link from "next/link";
import { Building2, CreditCard, Heart, Map, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SimulationRequestsPanel } from "@/components/dashboard/simulation-requests-panel";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold">Operacao do cliente</h1>
        </div>
        <Link href="/simulacao">
          <Button>
            <TrendingUp size={18} />
            Nova simulacao
          </Button>
        </Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <MetricCard icon={Map} label="Terrenos vistos" value="12" />
        <MetricCard icon={Building2} label="Projetos salvos" value="6" />
        <MetricCard icon={Heart} label="Favoritos" value="8" />
        <MetricCard icon={CreditCard} label="Pedidos" value="2" />
      </div>
      <div className="mt-8 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="text-xl font-semibold">Atividade recente</h2>
        <div className="mt-4 divide-y divide-[var(--line)]">
          {["Simulacao Casa Aurora criada", "Terreno Reserva Aldeia favoritado", "Checkout iniciado"].map((item) => (
            <div className="py-4 text-sm text-[var(--muted)]" key={item}>
              {item}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <SimulationRequestsPanel compact />
      </div>
    </section>
  );
}
