"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Map, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { area, money } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import { upsertCompatibility } from "@/services/compatibility";
import type { Project, Terrain } from "@/types/domain";

function toNumber(value: FormDataEntryValue | number | string | undefined | null) {
  const normalized = String(value ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function textAreaClass() {
  return "focus-ring min-h-28 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-3 text-sm outline-none placeholder:text-[var(--muted)]";
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    DRAFT: "Rascunho",
    PENDING_REVIEW: "Em analise",
    AVAILABLE: "Publicado",
    RESERVED: "Reservado",
    SOLD: "Vendido",
    ARCHIVED: "Arquivado",
    PUBLISHED: "Publicado",
    SUGGESTED: "Sugerido",
    APPROVED: "Aprovado",
    REJECTED: "Recusado"
  };

  return status ? (labels[status] ?? status) : "-";
}

function defaultCompatibilityScore(project: Project, terrain?: Terrain | null) {
  if (!terrain) {
    return 80;
  }

  const projectArea = toNumber(project.areaM2);
  const terrainArea = toNumber(terrain.areaM2);

  if (!projectArea || !terrainArea) {
    return 80;
  }

  if (projectArea > terrainArea) {
    return 35;
  }

  const occupation = projectArea / terrainArea;

  if (occupation <= 0.35) {
    return 92;
  }

  if (occupation <= 0.55) {
    return 84;
  }

  if (occupation <= 0.7) {
    return 72;
  }

  return 58;
}

function suggestedMinTerrainArea(project: Project) {
  const projectArea = toNumber(project.areaM2);
  return projectArea ? Math.ceil(projectArea * 1.15) : 0;
}

function meters(value: number | string | undefined | null) {
  const parsed = toNumber(value);
  return parsed ? `${parsed.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m` : "Nao informado";
}

function terrainFitScore(project: Project, terrain: Terrain) {
  const projectArea = toNumber(project.areaM2);
  const terrainArea = toNumber(terrain.areaM2);
  const minFrontage = toNumber(project.minFrontageM);
  const minDepth = toNumber(project.minDepthM);
  const frontage = toNumber(terrain.frontageM);
  const depth = toNumber(terrain.depthM);

  if (!projectArea || !terrainArea || terrainArea < projectArea) {
    return 0;
  }

  let score = defaultCompatibilityScore(project, terrain);
  const occupation = projectArea / terrainArea;

  if (occupation >= 0.35 && occupation <= 0.72) {
    score += 8;
  }

  if (minFrontage && frontage && frontage >= minFrontage) {
    score += 5;
  }

  if (minDepth && depth && depth >= minDepth) {
    score += 5;
  }

  return Math.min(100, score);
}

function terrainSummary(terrain: Terrain) {
  return [terrain.neighborhood, terrain.city, terrain.state].filter(Boolean).join(", ");
}

export function ProjectTerrainFitForm({ project, terrains }: { project: Project; terrains: Terrain[] }) {
  const queryClient = useQueryClient();
  const suggestedArea = suggestedMinTerrainArea(project);
  const suggestedFrontage = toNumber(project.minFrontageM);
  const suggestedDepth = toNumber(project.minDepthM);
  const [selectedTerrainId, setSelectedTerrainId] = useState("");
  const [terrainSearch, setTerrainSearch] = useState("");
  const [minArea, setMinArea] = useState(() => (suggestedArea ? String(suggestedArea) : ""));
  const [minFrontage, setMinFrontage] = useState(() => (suggestedFrontage ? String(suggestedFrontage) : ""));
  const [minDepth, setMinDepth] = useState(() => (suggestedDepth ? String(suggestedDepth) : ""));
  const linkedTerrains = (project.compatibilities ?? []).filter((compatibility) => compatibility.terrain);
  const filteredTerrains = useMemo(() => {
    const search = terrainSearch.trim().toLowerCase();
    const minAreaValue = toNumber(minArea);
    const minFrontageValue = toNumber(minFrontage);
    const minDepthValue = toNumber(minDepth);

    return terrains
      .map((terrain) => {
        const searchable = [
          terrain.title,
          terrain.address,
          terrain.neighborhood,
          terrain.city,
          terrain.state,
          String(terrain.areaM2 ?? ""),
          String(terrain.frontageM ?? ""),
          String(terrain.depthM ?? "")
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return {
          terrain,
          score: terrainFitScore(project, terrain),
          searchable
        };
      })
      .filter(({ terrain, searchable }) => {
        return (
          (!search || searchable.includes(search)) &&
          (!minAreaValue || toNumber(terrain.areaM2) >= minAreaValue) &&
          (!minFrontageValue || toNumber(terrain.frontageM) >= minFrontageValue) &&
          (!minDepthValue || toNumber(terrain.depthM) >= minDepthValue)
        );
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return toNumber(left.terrain.areaM2) - toNumber(right.terrain.areaM2);
      })
      .map(({ terrain }) => terrain);
  }, [terrains, terrainSearch, minArea, minFrontage, minDepth, project]);
  const visibleTerrains = filteredTerrains.slice(0, 8);
  const selectedTerrainValue = filteredTerrains.some((terrain) => terrain.id === selectedTerrainId)
    ? selectedTerrainId
    : (filteredTerrains[0]?.id ?? "");
  const selectedTerrain = terrains.find((terrain) => terrain.id === selectedTerrainValue) ?? null;
  const suggestedScore = defaultCompatibilityScore(project, selectedTerrain);

  const compatibilityMutation = useMutation({
    mutationFn: upsertCompatibility,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["architect"] }),
        queryClient.invalidateQueries({ queryKey: ["terrains"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "projects"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "terrains"] })
      ]);
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const terrainId = String(formData.get("terrainId") ?? "");

    if (!terrainId) {
      return;
    }

    compatibilityMutation.mutate({
      terrainId,
      projectId: project.id,
      status: "SUGGESTED",
      score: Math.max(0, Math.min(100, toNumber(formData.get("score")) || suggestedScore)),
      notes: optionalString(formData.get("notes"))
    });
  }

  return (
    <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
      {terrains.length ? (
        <>
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-3 text-sm text-[var(--muted)]">
            Primeiro aparecem terrenos que comportam o projeto de {area(project.areaM2)}. Ajuste a metragem minima ou
            pesquise por nome, cidade, bairro, rua, frente, fundo ou area.
          </div>

          {linkedTerrains.length ? (
            <div className="grid gap-2 rounded-[8px] border border-[var(--line)] p-3 text-sm">
              <p className="font-semibold">Terrenos ja vinculados</p>
              {linkedTerrains.map((compatibility) => (
                <button
                  className="focus-ring flex flex-wrap items-center justify-between gap-2 rounded-[8px] bg-black/5 px-3 py-2 text-left dark:bg-white/10"
                  key={compatibility.id}
                  onClick={() => setSelectedTerrainId(compatibility.terrain.id)}
                  type="button"
                >
                  <span>
                    <strong>{compatibility.terrain.title}</strong>
                    <span className="ml-2 text-xs text-[var(--muted)]">{terrainSummary(compatibility.terrain)}</span>
                  </span>
                  <span className="text-xs font-semibold text-[var(--accent)]">
                    {Number(compatibility.score).toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_120px_120px_120px]">
            <label className="grid gap-1 text-xs font-semibold uppercase text-[var(--muted)]">
              Buscar
              <Input
                onChange={(event) => setTerrainSearch(event.target.value)}
                placeholder="Nome, cidade, local ou metragem"
                value={terrainSearch}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase text-[var(--muted)]">
              Area min.
              <Input inputMode="numeric" min={0} onChange={(event) => setMinArea(event.target.value)} placeholder="m2" type="number" value={minArea} />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase text-[var(--muted)]">
              Frente min.
              <Input inputMode="numeric" min={0} onChange={(event) => setMinFrontage(event.target.value)} placeholder="m" type="number" value={minFrontage} />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase text-[var(--muted)]">
              Fundo min.
              <Input inputMode="numeric" min={0} onChange={(event) => setMinDepth(event.target.value)} placeholder="m" type="number" value={minDepth} />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted)]">
              {filteredTerrains.length} {filteredTerrains.length === 1 ? "terreno encontrado" : "terrenos encontrados"} com esta metragem.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="focus-ring rounded-[8px] border border-[var(--line)] px-3 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => {
                  setMinArea(suggestedArea ? String(suggestedArea) : "");
                  setMinFrontage(suggestedFrontage ? String(suggestedFrontage) : "");
                  setMinDepth(suggestedDepth ? String(suggestedDepth) : "");
                }}
                type="button"
              >
                Usar sugestao
              </button>
              <button
                className="focus-ring rounded-[8px] border border-[var(--line)] px-3 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => {
                  setTerrainSearch("");
                  setMinArea("");
                  setMinFrontage("");
                  setMinDepth("");
                }}
                type="button"
              >
                Ver todos
              </button>
            </div>
          </div>

          <input name="terrainId" type="hidden" value={selectedTerrainValue} />

          {visibleTerrains.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {visibleTerrains.map((terrain) => {
                const isSelected = terrain.id === selectedTerrainValue;
                const score = terrainFitScore(project, terrain);

                return (
                  <button
                    className={`focus-ring rounded-[8px] border p-3 text-left transition ${
                      isSelected
                        ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                        : "border-[var(--line)] hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                    key={terrain.id}
                    onClick={() => setSelectedTerrainId(terrain.id)}
                    type="button"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <strong className="block text-sm">{terrain.title}</strong>
                        <span className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)]">
                          <MapPin size={13} />
                          {terrainSummary(terrain) || "Localizacao nao informada"}
                        </span>
                      </span>
                      <span className="rounded-[8px] bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-white">{score}%</span>
                    </span>
                    <span className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
                      <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-2 py-2">{area(terrain.areaM2)}</span>
                      <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-2 py-2">Frente {meters(terrain.frontageM)}</span>
                      <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-2 py-2">Fundo {meters(terrain.depthM)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[8px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
              Nenhum terreno bate com essa metragem. Diminua area, frente ou fundo minimo para ver mais opcoes.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-[120px_1fr_auto]">
            <Input defaultValue={String(suggestedScore)} inputMode="numeric" key={selectedTerrainValue} max={100} min={0} name="score" placeholder="Nota" type="number" />
            <textarea className={`${textAreaClass()} min-h-11 py-3`} name="notes" placeholder="Observacao para aparecer na pagina do terreno." />
            <Button disabled={compatibilityMutation.isPending || !selectedTerrainValue} type="submit" variant="secondary">
              <Map size={18} />
              Vincular terreno
            </Button>
          </div>

          {selectedTerrain ? (
            <div className="grid gap-3 rounded-[8px] bg-black/5 p-4 text-sm dark:bg-white/10 md:grid-cols-4">
              <div className="md:col-span-4">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{selectedTerrain.title}</strong>
                  <span className="rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                    {statusLabel(selectedTerrain.status)}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-2 text-[var(--muted)]">
                  <MapPin size={15} />
                  {terrainSummary(selectedTerrain) || "Localizacao nao informada"}
                </p>
              </div>
              <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                Area: <strong>{area(selectedTerrain.areaM2)}</strong>
              </span>
              <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                Frente: <strong>{meters(selectedTerrain.frontageM)}</strong>
              </span>
              <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                Fundo: <strong>{meters(selectedTerrain.depthM)}</strong>
              </span>
              <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                Valor: <strong>{money(selectedTerrain.price)}</strong>
              </span>
            </div>
          ) : null}

          {compatibilityMutation.isSuccess ? (
            <p className="rounded-[8px] bg-emerald-500/10 p-3 text-sm text-emerald-700">
              Terreno vinculado ao projeto. Ele ja pode aparecer na pagina do lote.
            </p>
          ) : null}
          {compatibilityMutation.isError ? (
            <p className="rounded-[8px] bg-red-500/10 p-3 text-sm text-red-600">
              Não foi possível salvar a adequação: {getApiErrorMessage(compatibilityMutation.error)}
            </p>
          ) : null}
        </>
      ) : (
        <div className="rounded-[8px] border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
          Nenhum terreno disponivel para escolher agora.
        </div>
      )}
    </form>
  );
}
