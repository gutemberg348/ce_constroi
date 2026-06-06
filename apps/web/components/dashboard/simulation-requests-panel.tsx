"use client";

import { MessageCircle } from "lucide-react";
import { money } from "@/lib/format";
import { useSimulationRequestsStore } from "@/stores/simulation-requests-store";

function whatsappHref(phone: string, id: string) {
  const digits = phone.replace(/\D/g, "");
  const target = digits.length >= 10 ? `55${digits.replace(/^55/, "")}` : "5511999999999";
  const text = encodeURIComponent(`Ola, estou retornando sobre sua simulacao ${id} da Ce constroi.`);

  return `https://wa.me/${target}?text=${text}`;
}

export function SimulationRequestsPanel({ compact = false }: { compact?: boolean }) {
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
                  <span>
                    Escolha: {request.requestedOptionLabel ?? "Valor manual"}
                    {request.requestedOptionValue ? ` (${money(request.requestedOptionValue)})` : ""}
                  </span>
                  <span>
                    Indicacao: {request.selectedOptionLabel ?? "Buscar abaixo da base"}
                    {request.selectedOptionValue ? ` (${money(request.selectedOptionValue)})` : ""}
                  </span>
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
