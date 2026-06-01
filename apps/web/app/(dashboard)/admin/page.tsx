"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Building2, Check, CreditCard, Map, RefreshCw, ShieldAlert, Users, X } from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SimulationRequestsPanel } from "@/components/dashboard/simulation-requests-panel";
import { Button } from "@/components/ui/button";
import { approveArchitect, getAdminMetrics, getArchitectsForReview, rejectArchitect } from "@/services/admin";
import { useAuthStore } from "@/stores/auth-store";
import { money } from "@/lib/format";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const isAdmin = user?.role === "ADMIN";

  const metricsQuery = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: getAdminMetrics,
    enabled: Boolean(accessToken && isAdmin)
  });

  const architectsQuery = useQuery({
    queryKey: ["admin", "architects", "pending"],
    queryFn: () => getArchitectsForReview("PENDING_REVIEW"),
    enabled: Boolean(accessToken && isAdmin)
  });

  const approveMutation = useMutation({
    mutationFn: approveArchitect,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectArchitect(id, "Perfil recusado na curadoria inicial."),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  if (!accessToken || !isAdmin) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <ShieldAlert className="mx-auto text-[var(--accent)]" size={38} />
          <h1 className="mt-4 text-3xl font-semibold">Entre como admin</h1>
          <p className="mt-3 text-[var(--muted)]">
            Use o login demo do admin para ver metricas e aprovar arquitetos.
          </p>
          <div className="mt-6 rounded-[8px] border border-[var(--line)] bg-black/5 p-4 text-left text-sm dark:bg-white/10">
            <p>
              <strong>Email:</strong> admin@anselmo.dev
            </p>
            <p>
              <strong>Senha:</strong> Admin@123456
            </p>
          </div>
          <Link className="mt-6 inline-flex" href="/login">
            <Button>Ir para login</Button>
          </Link>
        </div>
      </section>
    );
  }

  const metrics = metricsQuery.data;
  const pendingArchitects = architectsQuery.data ?? [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--accent)]">Admin</p>
          <h1 className="mt-3 text-4xl font-semibold">Controle geral do marketplace</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Curadoria de arquitetos, metricas comerciais, operacao e governanca do catalogo.
          </p>
        </div>
        <Button
          onClick={() => {
            void queryClient.invalidateQueries({ queryKey: ["admin"] });
          }}
          type="button"
          variant="ghost"
        >
          <RefreshCw size={18} />
          Atualizar
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        <MetricCard icon={Users} label="Usuarios" value={String(metrics?.users ?? "...")} />
        <MetricCard icon={Building2} label="Arquitetos" value={String(metrics?.architects ?? "...")} />
        <MetricCard icon={ShieldAlert} label="Pendentes" value={String(metrics?.pendingArchitects ?? "...")} />
        <MetricCard icon={Map} label="Terrenos" value={String(metrics?.terrains ?? "...")} />
        <MetricCard icon={CreditCard} label="GMV" value={metrics ? money(metrics.grossMerchandiseValue) : "..."} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Curadoria</p>
              <h2 className="mt-1 text-2xl font-semibold">Arquitetos aguardando aprovacao</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {pendingArchitects.length} na fila
            </span>
          </div>

          <div className="mt-5 divide-y divide-[var(--line)]">
            {pendingArchitects.length === 0 ? (
              <div className="py-10 text-center text-[var(--muted)]">Nenhum arquiteto pendente agora.</div>
            ) : (
              pendingArchitects.map((architect) => (
                <div className="grid gap-4 py-5 md:grid-cols-[1fr_auto]" key={architect.id}>
                  <div>
                    <h3 className="text-lg font-semibold">{architect.companyName ?? architect.user.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{architect.user.email}</p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                      {architect.bio ?? "Perfil sem bio preenchida."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                      <span className="rounded-[8px] border border-[var(--line)] px-2 py-1">
                        CAU: {architect.cauNumber ?? "nao informado"}
                      </span>
                      <span className="rounded-[8px] border border-[var(--line)] px-2 py-1">
                        Projetos: {architect._count?.projects ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    <Button
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(architect.id)}
                      type="button"
                      variant="secondary"
                    >
                      <Check size={18} />
                      Aprovar
                    </Button>
                    <Button
                      disabled={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(architect.id)}
                      type="button"
                      variant="ghost"
                    >
                      <X size={18} />
                      Recusar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="rounded-[8px] border border-[var(--line)] bg-[#11150f] p-6 text-white dark:bg-white dark:text-[#11150f]">
          <Activity size={28} />
          <h2 className="mt-6 text-2xl font-semibold">Operacao pronta para teste</h2>
          <div className="mt-5 space-y-4 text-sm opacity-80">
            <p>1. Entre como arquiteto pendente.</p>
            <p>2. Veja o painel bloqueado aguardando curadoria.</p>
            <p>3. Entre como admin e aprove o perfil.</p>
            <p>4. Volte como arquiteto e publique projetos.</p>
          </div>
        </aside>
      </div>

      <div className="mt-8">
        <SimulationRequestsPanel />
      </div>
    </section>
  );
}
