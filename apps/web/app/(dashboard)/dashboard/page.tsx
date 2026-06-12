"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, Building2, CreditCard, Heart, Map, ShieldAlert, TrendingUp, UserRound } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SimulationRequestsPanel } from "@/components/dashboard/simulation-requests-panel";
import { Button } from "@/components/ui/button";
import { area, money } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import { getMyDashboard } from "@/services/dashboard";
import { useAuthStore } from "@/stores/auth-store";

function dateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Banido",
  PENDING_REVIEW: "Em analise",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  DRAFT: "Rascunho",
  AVAILABLE: "Publicado",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  ARCHIVED: "Arquivado",
  PUBLISHED: "Publicado",
  SENT: "Enviado",
  CONVERTED: "Convertido",
  EXPIRED: "Expirado",
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado"
};

function statusLabel(status?: string) {
  return status ? (statusLabels[status] ?? status) : "-";
}

function statusPill(status?: string) {
  return (
    <span className="rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
      {statusLabel(status)}
    </span>
  );
}

function panelClass() {
  return "rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5";
}

function errorMessage(error: unknown) {
  return getApiErrorMessage(error, "Não foi possível carregar seu painel agora.");
}

export default function DashboardPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "me"],
    queryFn: getMyDashboard,
    enabled: Boolean(accessToken)
  });

  if (!accessToken) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <UserRound className="mx-auto text-[var(--accent)]" size={38} />
          <h1 className="mt-4 text-3xl font-semibold">Entre para ver seu painel</h1>
          <p className="mt-3 text-[var(--muted)]">Favoritos, propostas, pedidos e terrenos anunciados aparecem aqui.</p>
          <Link className="mt-6 inline-flex" href="/login?next=/dashboard">
            <Button>Ir para login</Button>
          </Link>
        </div>
      </section>
    );
  }

  const dashboard = dashboardQuery.data;
  const metrics = dashboard?.metrics;
  const isOwner = (dashboard?.user.role ?? user?.role) === "TERRAIN_OWNER";
  const isArchitect = (dashboard?.user.role ?? user?.role) === "ARCHITECT";

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold">
            {isOwner ? "Painel do proprietario" : isArchitect ? "Painel do arquiteto" : "Painel do cliente"}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            {dashboard?.user.name ?? user?.name ?? "Sua conta"} - dados carregados do PostgreSQL.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/simulacao">
            <Button>
              <TrendingUp size={18} />
              Nova simulacao
            </Button>
          </Link>
          {isOwner ? (
            <Link href="/anunciar-terreno">
              <Button type="button" variant="secondary">
                <Map size={18} />
                Anunciar terreno
              </Button>
            </Link>
          ) : null}
          {isArchitect ? (
            <Link href="/painel-arquiteto">
              <Button type="button" variant="secondary">
                <Building2 size={18} />
                Projetos
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {isOwner ? (
          <>
            <MetricCard icon={Map} label="Meus terrenos" value={String(metrics?.ownedTerrains ?? "...")} />
            <MetricCard icon={ShieldAlert} label="Pendentes" value={String(metrics?.pendingOwnedTerrains ?? "...")} />
            <MetricCard icon={Map} label="Publicados" value={String(metrics?.availableOwnedTerrains ?? "...")} />
            <MetricCard icon={TrendingUp} label="Acessos" value={String(metrics?.visits ?? "...")} />
          </>
        ) : isArchitect ? (
          <>
            <MetricCard icon={Building2} label="Meus projetos" value={String(metrics?.architectProjects ?? "...")} />
            <MetricCard icon={Heart} label="Favoritos" value={String(metrics?.favorites ?? "...")} />
            <MetricCard icon={CreditCard} label="Pedidos" value={String(metrics?.orders ?? "...")} />
            <MetricCard icon={TrendingUp} label="Acessos" value={String(metrics?.visits ?? "...")} />
          </>
        ) : (
          <>
            <MetricCard icon={Heart} label="Favoritos" value={String(metrics?.favorites ?? "...")} />
            <MetricCard icon={TrendingUp} label="Simulacoes" value={String(metrics?.simulations ?? "...")} />
            <MetricCard icon={CreditCard} label="Pedidos" value={String(metrics?.orders ?? "...")} />
            <MetricCard icon={Bell} label="Notificacoes" value={String(metrics?.notifications ?? "...")} />
          </>
        )}
      </div>

      {dashboardQuery.isLoading ? (
        <div className="mt-8 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-sm text-[var(--muted)]">
          Carregando dados do banco...
        </div>
      ) : null}

      {dashboardQuery.isError ? (
        <div className="mt-8 rounded-[8px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
          Falha ao carregar o dashboard: {errorMessage(dashboardQuery.error)}. Verifique se a API e o PostgreSQL estao rodando.
        </div>
      ) : null}

      {isOwner ? (
        <div className={`mt-8 ${panelClass()}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Proprietario</p>
              <h2 className="mt-1 text-2xl font-semibold">Meus terrenos anunciados</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {dashboard?.ownedTerrains.length ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {dashboard?.ownedTerrains.length ? (
              dashboard.ownedTerrains.map((terrain) => (
                <div className="grid gap-4 py-4 md:grid-cols-[1fr_auto]" key={terrain.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{terrain.title}</h3>
                      {statusPill(terrain.status)}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {[terrain.neighborhood, terrain.city, terrain.state].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                      <span>{area(terrain.areaM2)}</span>
                      <span>{money(terrain.price)}</span>
                      <span>Favoritos {terrain._count?.favorites ?? 0}</span>
                      <span>Simulacoes {terrain._count?.simulations ?? 0}</span>
                    </div>
                  </div>
                  <Link className="text-sm font-semibold text-[var(--accent)]" href={`/terrenos/${terrain.id}`}>
                    Abrir
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum terreno anunciado por esta conta ainda.</div>
            )}
          </div>
        </div>
      ) : null}

      {isArchitect ? (
        <div className={`mt-8 ${panelClass()}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Arquiteto</p>
              <h2 className="mt-1 text-2xl font-semibold">Projetos publicados</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {dashboard?.architectProjects.length ?? 0}
            </span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {dashboard?.architectProjects.length ? (
              dashboard.architectProjects.map((project) => (
                <div className="rounded-[8px] border border-[var(--line)] p-4" key={project.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{project.title}</h3>
                    {statusPill(project.status)}
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">{project.style ?? "Sem estilo"} - {area(project.areaM2)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                    <span>{money(project.price)}</span>
                    <span>Favoritos {project._count?.favorites ?? 0}</span>
                    <span>Pedidos {project._count?.orders ?? 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum projeto cadastrado ainda.</div>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className={panelClass()}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Favoritos</p>
              <h2 className="mt-1 text-2xl font-semibold">Itens salvos</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {metrics?.favorites ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {dashboard?.favorites.length ? (
              dashboard.favorites.map((favorite) => (
                <div className="py-4" key={favorite.id}>
                  <h3 className="font-semibold">{favorite.terrain?.title ?? favorite.project?.title ?? "Item removido"}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{dateTime(favorite.createdAt)}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum favorito salvo.</div>
            )}
          </div>
        </div>

        <div className={panelClass()}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Propostas</p>
              <h2 className="mt-1 text-2xl font-semibold">Simulacoes salvas</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {metrics?.simulations ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {dashboard?.simulations.length ? (
              dashboard.simulations.map((simulation) => (
                <div className="py-4" key={simulation.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{simulation.terrain?.title ?? "Simulacao manual"}</h3>
                    {statusPill(simulation.status)}
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Total {money(simulation.totalAmount)} - parcela {money(simulation.monthlyPayment)}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhuma simulacao salva.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className={panelClass()}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Pedidos</p>
              <h2 className="mt-1 text-2xl font-semibold">Compras e contratos</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {metrics?.orders ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {dashboard?.orders.length ? (
              dashboard.orders.map((order) => (
                <div className="py-4" key={order.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{order.terrain?.title ?? order.project?.title ?? "Pedido"}</h3>
                    {statusPill(order.status)}
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {money(order.total)} - {dateTime(order.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum pedido ainda.</div>
            )}
          </div>
        </div>

        <div className={panelClass()}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Notificacoes</p>
              <h2 className="mt-1 text-2xl font-semibold">Atualizacoes da conta</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {metrics?.notifications ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {dashboard?.notifications.length ? (
              dashboard.notifications.map((notification) => (
                <div className="py-4" key={notification.id}>
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{notification.body}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhuma notificacao por enquanto.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SimulationRequestsPanel compact />
      </div>
    </section>
  );
}
