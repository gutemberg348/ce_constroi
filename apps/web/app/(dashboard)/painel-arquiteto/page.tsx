"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertTriangle, BarChart3, Building2, CheckCircle2, Clock, Upload, Wallet } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { getArchitectMe, getArchitectStats } from "@/services/architects";
import { useAuthStore } from "@/stores/auth-store";

export default function ArchitectPanelPage() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isArchitect = user?.role === "ARCHITECT";

  const profileQuery = useQuery({
    queryKey: ["architect", "me"],
    queryFn: getArchitectMe,
    enabled: Boolean(accessToken && isArchitect)
  });

  const statsQuery = useQuery({
    queryKey: ["architect", "stats"],
    queryFn: getArchitectStats,
    enabled: Boolean(accessToken && isArchitect)
  });

  if (!accessToken || !isArchitect) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <Building2 className="mx-auto text-[var(--accent)]" size={38} />
          <h1 className="mt-4 text-3xl font-semibold">Entre como arquiteto</h1>
          <p className="mt-3 text-[var(--muted)]">
            Use o login aprovado ou pendente para testar o fluxo de curadoria.
          </p>
          <div className="mt-6 rounded-[8px] border border-[var(--line)] bg-black/5 p-4 text-left text-sm dark:bg-white/10">
            <p>
              <strong>Aprovado:</strong> arquiteto@anselmo.dev / Arq@123456
            </p>
            <p>
              <strong>Pendente:</strong> pendente@anselmo.dev / Arq@123456
            </p>
          </div>
          <Link className="mt-6 inline-flex" href="/login">
            <Button>Ir para login</Button>
          </Link>
        </div>
      </section>
    );
  }

  const profile = profileQuery.data;
  const stats = statsQuery.data;
  const isApproved = profile?.status === "APPROVED";

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--accent)]">Painel arquiteto</p>
          <h1 className="mt-3 text-4xl font-semibold">
            {profile?.companyName ?? profile?.user.name ?? "Studio"}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Gerencie projetos, acompanhe vendas e confira se seu perfil ja passou pela curadoria do admin.
          </p>
        </div>
        <Button disabled={!isApproved} type="button">
          <Upload size={18} />
          Publicar projeto
        </Button>
      </div>

      <div
        className={`mt-8 rounded-[8px] border p-5 ${
          isApproved
            ? "border-emerald-500/30 bg-emerald-500/10"
            : "border-amber-500/30 bg-amber-500/10"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            {isApproved ? <CheckCircle2 className="text-emerald-600" size={24} /> : <Clock className="text-amber-600" size={24} />}
            <div>
              <h2 className="text-xl font-semibold">
                {isApproved ? "Perfil aprovado" : "Perfil aguardando aprovacao"}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {isApproved
                  ? "Voce ja pode publicar projetos e receber vendas."
                  : "O admin precisa aprovar seu cadastro antes de liberar publicacao de projetos."}
              </p>
            </div>
          </div>
          {!isApproved ? (
            <Link href="/admin" className="text-sm font-semibold text-[var(--accent)]">
              Testar aprovacao no admin
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MetricCard icon={Building2} label="Projetos ativos" value={String(stats?.projects ?? 0)} />
        <MetricCard icon={Wallet} label="Pedidos pagos" value={String(stats?.paidOrders ?? 0)} />
        <MetricCard icon={BarChart3} label="Conversao" value={`${Math.round((stats?.conversionRate ?? 0) * 100)}%`} />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {profile?.projects?.length ? (
          profile.projects.map((project) => (
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5" key={project.id}>
              <p className="text-sm text-[var(--muted)]">Projeto publicado</p>
              <h2 className="mt-1 text-xl font-semibold">{project.title}</h2>
              <p className="mt-3 text-sm text-[var(--muted)]">{project.description}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 md:col-span-2">
            <AlertTriangle className="text-[var(--accent-3)]" size={24} />
            <h2 className="mt-4 text-xl font-semibold">Nenhum projeto carregado ainda</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Assim que o arquiteto aprovado cadastrar projetos, eles aparecem aqui e entram no marketplace.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
