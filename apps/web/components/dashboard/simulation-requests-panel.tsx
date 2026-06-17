"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { money } from "@/lib/format";
import { getAdminSimulations, updateAdminSimulationStatus } from "@/services/admin";
import { getApiErrorMessage } from "@/services/api";
import { useAuthStore } from "@/stores/auth-store";
import { useSimulationRequestsStore } from "@/stores/simulation-requests-store";
import type { AdminSimulation, SimulationStatus } from "@/types/domain";

function whatsappHref(phone: string | undefined, id: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const target = digits.length >= 10 ? `55${digits.replace(/^55/, "")}` : "5511999999999";
  const text = encodeURIComponent(`Ola, estou retornando sobre sua simulacao ${id} da Ce constroi.`);

  return `https://wa.me/${target}?text=${text}`;
}

function statusLabel(status: SimulationStatus) {
  const labels: Record<SimulationStatus, string> = {
    DRAFT: "Novo",
    SENT: "Em atendimento",
    CONVERTED: "Finalizado",
    EXPIRED: "Expirado"
  };

  return labels[status] ?? status;
}

function nextStatus(status: SimulationStatus): SimulationStatus {
  if (status === "DRAFT") {
    return "SENT";
  }

  if (status === "SENT") {
    return "CONVERTED";
  }

  return status;
}

function metadataResult(simulation: AdminSimulation) {
  const metadata = simulation.metadata;

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const result = metadata.result;
  return result && typeof result === "object" ? (result as Record<string, unknown>) : null;
}

function metadataObject(simulation: AdminSimulation, key: string) {
  const metadata = simulation.metadata;

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const value = metadata[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function displayNumber(simulation: AdminSimulation, key: string, fallback: number | string) {
  return numberValue(metadataObject(simulation, "frontendResult")?.[key]) ?? fallback;
}

function filledCustomer(simulation: AdminSimulation) {
  return metadataObject(simulation, "customerFilled");
}

function displayCustomerName(simulation: AdminSimulation) {
  const customer = filledCustomer(simulation);
  return typeof customer?.name === "string" && customer.name.trim()
    ? customer.name.trim()
    : simulation.customer?.name ?? "Cliente nao vinculado";
}

function resultText(simulation: AdminSimulation) {
  const result = metadataResult(simulation);
  const status = typeof result?.status === "string" ? result.status : null;

  return status ?? "Simulacao salva no banco para acompanhamento do atendimento.";
}

function AdminSimulationRequestsPanel({ compact }: { compact: boolean }) {
  const queryClient = useQueryClient();
  const simulationsQuery = useQuery({
    queryKey: ["admin", "simulation-requests", compact],
    queryFn: () => getAdminSimulations({ limit: compact ? 3 : 10 })
  });
  const advanceMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SimulationStatus }) => updateAdminSimulationStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });
  const simulations = simulationsQuery.data?.items ?? [];

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Atendimento</p>
          <h2 className="mt-1 text-xl font-semibold">Pedidos de simulacao</h2>
        </div>
        <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
          {simulationsQuery.data?.meta.total ?? simulations.length}
        </span>
      </div>

      <div className="mt-5 divide-y divide-[var(--line)]">
        {simulationsQuery.isLoading ? (
          <div className="py-8 text-sm text-[var(--muted)]">Carregando simulacoes...</div>
        ) : simulations.length === 0 ? (
          <div className="py-8 text-sm text-[var(--muted)]">Nenhuma simulacao salva no banco ainda.</div>
        ) : (
          simulations.map((simulation) => {
            const canAdvance = simulation.status === "DRAFT" || simulation.status === "SENT";
            const targetStatus = nextStatus(simulation.status);

            return (
              <div className="grid gap-4 py-4 md:grid-cols-[1fr_auto]" key={simulation.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{displayCustomerName(simulation)}</h3>
                    <span className="rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                      {statusLabel(simulation.status)}
                    </span>
                    <span className="rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                      {simulation.id}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{resultText(simulation)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                    <span>Pacote: {money(displayNumber(simulation, "desiredPackageValue", simulation.totalAmount))}</span>
                    <span>Parcela: {money(displayNumber(simulation, "estimatedInstallment", simulation.monthlyPayment))}</span>
                    <span>Entrada informada: {money(displayNumber(simulation, "availableEntry", simulation.downPayment))}</span>
                    <span>Entrada necessaria: {money(displayNumber(simulation, "minimumRequiredEntry", simulation.downPayment))}</span>
                    <span>{simulation.terrain?.title ?? "Terreno manual"}</span>
                    <span>{simulation.project?.title ?? "Sem projeto"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <a
                    className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#25d366] px-3 text-sm font-semibold text-[#062014]"
                    href={whatsappHref(simulation.customer?.phone, simulation.id)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                  <button
                    className="focus-ring h-10 rounded-[8px] border border-[var(--line)] px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
                    disabled={!canAdvance || advanceMutation.isPending}
                    onClick={() => advanceMutation.mutate({ id: simulation.id, status: targetStatus })}
                    type="button"
                  >
                    {canAdvance ? "Avancar" : "Finalizado"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {advanceMutation.isError ? (
        <p className="mt-4 rounded-[8px] bg-red-500/10 p-3 text-sm text-red-600">
          {getApiErrorMessage(advanceMutation.error, "Nao foi possivel avancar a simulacao.")}
        </p>
      ) : null}
    </div>
  );
}

function LocalSimulationRequestsPanel({ compact }: { compact: boolean }) {
  const requests = useSimulationRequestsStore((state) => state.requests);
  const updateStage = useSimulationRequestsStore((state) => state.updateStage);

  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Atendimento</p>
          <h2 className="mt-1 text-xl font-semibold">Pedidos de simulacao</h2>
        </div>
        <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
          {requests.length}
        </span>
      </div>

      <div className="mt-5 divide-y divide-[var(--line)]">
        {requests.length === 0 ? (
          <div className="py-8 text-sm text-[var(--muted)]">Nenhum pedido cadastrado neste navegador ainda.</div>
        ) : (
          requests.slice(0, compact ? 3 : 10).map((request) => (
            <div className="grid gap-4 py-4 md:grid-cols-[1fr_auto]" key={request.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{request.name}</h3>
                  <span className="rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                    {request.stage}
                  </span>
                  <span className="rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                    {request.id}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{request.fitMessage}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                  <span>Credito: {money(request.maxCredit)}</span>
                  <span>Base: {money(request.maxPropertyValue)}</span>
                  <span>Entrada/FGTS: {money(request.availableEntry ?? 0)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <a
                  className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#25d366] px-3 text-sm font-semibold text-[#062014]"
                  href={whatsappHref(request.phone, request.id)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
                <button
                  className="focus-ring h-10 rounded-[8px] border border-[var(--line)] px-3 text-sm font-semibold"
                  onClick={() => updateStage(request.id, request.stage === "Novo" ? "Em atendimento" : "Finalizado")}
                  type="button"
                >
                  Avancar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function SimulationRequestsPanel({ compact = false }: { compact?: boolean }) {
  const user = useAuthStore((state) => state.user);

  if (user?.role === "ADMIN") {
    return <AdminSimulationRequestsPanel compact={compact} />;
  }

  return <LocalSimulationRequestsPanel compact={compact} />;
}
