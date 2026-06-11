"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Map,
  MapPin,
  Upload,
  Wallet
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { area, money } from "@/lib/format";
import { formDataImageValue } from "@/lib/files";
import { getArchitectMe, getArchitectStats, updateArchitectProfile } from "@/services/architects";
import { upsertCompatibility } from "@/services/compatibility";
import { addProjectImage } from "@/services/project-images";
import { createProject, type CreateProjectInput } from "@/services/projects";
import { getTerrains } from "@/services/terrains";
import { useAuthStore } from "@/stores/auth-store";
import type { Project, Terrain } from "@/types/domain";

function toNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function textAreaClass() {
  return "focus-ring min-h-28 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-3 text-sm outline-none placeholder:text-[var(--muted)]";
}

function selectClass() {
  return "focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none";
}

function fileInputClass() {
  return "focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm outline-none file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#061733] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white";
}

type PendingProjectImage = {
  url: string;
  altText: string;
  sortOrder: number;
  isCover?: boolean;
};

const maxProjectImageSizeMb = 8;
const maxProjectImageSize = maxProjectImageSizeMb * 1024 * 1024;

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { error?: unknown; message?: unknown } } }).response;
    const bodyError = response?.data?.error;
    const bodyMessage = response?.data?.message;

    if (typeof bodyError === "string") {
      return bodyError;
    }

    if (bodyError && typeof bodyError === "object" && "message" in bodyError) {
      const message = (bodyError as { message?: unknown }).message;
      return Array.isArray(message) ? message.join(" ") : String(message ?? "Nao foi possivel concluir a acao.");
    }

    if (typeof bodyMessage === "string") {
      return bodyMessage;
    }
  }

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Nao foi possivel carregar o painel agora.";
}

function numberValue(value: number | string | undefined | null) {
  const parsed = Number(String(value ?? "0").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function requireProjectImage(formData: FormData, key: string, label: string) {
  const value = formData.get(key);

  if (!value || typeof value === "string" || value.size === 0) {
    throw new Error(`Envie a imagem: ${label}.`);
  }

  if (value.size > maxProjectImageSize) {
    throw new Error(`${label} precisa ter ate ${maxProjectImageSizeMb}MB.`);
  }

  return value;
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
  SUGGESTED: "Sugerido",
  APPROVED_COMPATIBILITY: "Aprovado",
  REJECTED_COMPATIBILITY: "Recusado"
};

function statusLabel(status?: string) {
  return status ? (statusLabels[status] ?? status) : "-";
}

function defaultCompatibilityScore(project: Project, terrain?: Terrain | null) {
  if (!terrain) {
    return 80;
  }

  const projectArea = numberValue(project.areaM2);
  const terrainArea = numberValue(terrain.areaM2);

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
  const projectArea = numberValue(project.areaM2);
  return projectArea ? Math.ceil(projectArea * 1.15) : 0;
}

function meters(value: number | string | undefined | null) {
  const parsed = numberValue(value);
  return parsed ? `${parsed.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m` : "Nao informado";
}

function terrainFitScore(project: Project, terrain: Terrain) {
  const projectArea = numberValue(project.areaM2);
  const terrainArea = numberValue(terrain.areaM2);
  const minFrontage = numberValue(project.minFrontageM);
  const minDepth = numberValue(project.minDepthM);
  const frontage = numberValue(terrain.frontageM);
  const depth = numberValue(terrain.depthM);

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

function ProjectTerrainFitForm({ project, terrains }: { project: Project; terrains: Terrain[] }) {
  const queryClient = useQueryClient();
  const suggestedArea = suggestedMinTerrainArea(project);
  const suggestedFrontage = numberValue(project.minFrontageM);
  const suggestedDepth = numberValue(project.minDepthM);
  const [selectedTerrainId, setSelectedTerrainId] = useState("");
  const [terrainSearch, setTerrainSearch] = useState("");
  const [minArea, setMinArea] = useState(() => (suggestedArea ? String(suggestedArea) : ""));
  const [minFrontage, setMinFrontage] = useState(() => (suggestedFrontage ? String(suggestedFrontage) : ""));
  const [minDepth, setMinDepth] = useState(() => (suggestedDepth ? String(suggestedDepth) : ""));
  const linkedTerrains = (project.compatibilities ?? []).filter((compatibility) => compatibility.terrain);
  const filteredTerrains = useMemo(() => {
    const search = terrainSearch.trim().toLowerCase();
    const minAreaValue = numberValue(minArea);
    const minFrontageValue = numberValue(minFrontage);
    const minDepthValue = numberValue(minDepth);

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
          (!minAreaValue || numberValue(terrain.areaM2) >= minAreaValue) &&
          (!minFrontageValue || numberValue(terrain.frontageM) >= minFrontageValue) &&
          (!minDepthValue || numberValue(terrain.depthM) >= minDepthValue)
        );
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return numberValue(left.terrain.areaM2) - numberValue(right.terrain.areaM2);
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
      await queryClient.invalidateQueries({ queryKey: ["architect"] });
      await queryClient.invalidateQueries({ queryKey: ["terrains"] });
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
      notes: toOptionalString(formData.get("notes"))
    });
  }

  return (
    <details className="mt-4 rounded-[8px] border border-[var(--line)] p-4" open>
      <summary className="cursor-pointer text-sm font-semibold">Adequar a terreno</summary>
      {terrains.length ? (
        <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-3 text-sm text-[var(--muted)]">
            A lista ja prioriza terrenos que comportam este projeto de {area(project.areaM2)}. Ajuste a metragem minima
            para encontrar lotes com frente, fundo e area alinhados.
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
                placeholder="Cidade, bairro, rua ou metragem"
                value={terrainSearch}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase text-[var(--muted)]">
              Area min.
              <Input
                inputMode="numeric"
                min={0}
                onChange={(event) => setMinArea(event.target.value)}
                placeholder="m2"
                type="number"
                value={minArea}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase text-[var(--muted)]">
              Frente min.
              <Input
                inputMode="numeric"
                min={0}
                onChange={(event) => setMinFrontage(event.target.value)}
                placeholder="m"
                type="number"
                value={minFrontage}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase text-[var(--muted)]">
              Fundo min.
              <Input
                inputMode="numeric"
                min={0}
                onChange={(event) => setMinDepth(event.target.value)}
                placeholder="m"
                type="number"
                value={minDepth}
              />
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
                      <span className="rounded-[8px] bg-[var(--accent)] px-2 py-1 text-xs font-semibold text-white">
                        {score}%
                      </span>
                    </span>
                    <span className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
                      <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-2 py-2">
                        {area(terrain.areaM2)}
                      </span>
                      <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-2 py-2">
                        Frente {meters(terrain.frontageM)}
                      </span>
                      <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-2 py-2">
                        Fundo {meters(terrain.depthM)}
                      </span>
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
            <Input
              defaultValue={String(suggestedScore)}
              inputMode="numeric"
              key={selectedTerrainValue}
              max={100}
              min={0}
              name="score"
              placeholder="Nota"
              type="number"
            />
            <textarea
              className={`${textAreaClass()} min-h-11 py-3`}
              name="notes"
              placeholder="Observacao para aparecer na pagina do terreno, por exemplo: projeto compacto com boa folga lateral."
            />
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
                Frente: <strong>{selectedTerrain.frontageM ? `${selectedTerrain.frontageM} m` : "Nao informada"}</strong>
              </span>
              <span className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                Fundo: <strong>{selectedTerrain.depthM ? `${selectedTerrain.depthM} m` : "Nao informado"}</strong>
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
              Nao foi possivel salvar a adequacao: {errorMessage(compatibilityMutation.error)}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="mt-4 rounded-[8px] border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
          Nenhum terreno disponivel para escolher agora.
        </div>
      )}
    </details>
  );
}

export default function ArchitectPanelPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isArchitect = user?.role === "ARCHITECT";
  const [activeWorkspace, setActiveWorkspace] = useState<"projects" | "new-project" | "profile">("projects");
  const [projectFormError, setProjectFormError] = useState<string | null>(null);

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

  const profile = profileQuery.data;
  const stats = statsQuery.data;
  const isApproved = profile?.status === "APPROVED";
  const projects = profile?.projects ?? [];

  const terrainsQuery = useQuery({
    queryKey: ["architect", "available-terrains"],
    queryFn: () => getTerrains({ limit: 300 }),
    enabled: Boolean(accessToken && isArchitect && isApproved)
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateArchitectProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["architect"] });
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async ({ input, images }: { input: CreateProjectInput; images: PendingProjectImage[] }) => {
      const project = await createProject(input);

      for (const image of images) {
        await addProjectImage({
          projectId: project.id,
          url: image.url,
          altText: image.altText,
          sortOrder: image.sortOrder,
          isCover: image.isCover
        });
      }

      return project;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["architect"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  if (!accessToken || !isArchitect) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <Building2 className="mx-auto text-[var(--accent)]" size={38} />
          <h1 className="mt-4 text-3xl font-semibold">Entre como arquiteto</h1>
          <p className="mt-3 text-[var(--muted)]">
            Use uma conta de arquiteto para completar perfil, publicar projetos e acompanhar vendas.
          </p>
          <div className="mt-6 rounded-[8px] border border-[var(--line)] bg-black/5 p-4 text-left text-sm dark:bg-white/10">
            <p>
              <strong>Aprovado:</strong> arquiteto@anselmo.dev / Arq@123456
            </p>
            <p>
              <strong>Pendente:</strong> pendente@anselmo.dev / Arq@123456
            </p>
          </div>
          <Link className="mt-6 inline-flex" href="/login?next=/painel-arquiteto">
            <Button>Ir para login</Button>
          </Link>
        </div>
      </section>
    );
  }

  const terrains = terrainsQuery.data?.items ?? [];

  function onProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    updateProfileMutation.mutate({
      companyName: toOptionalString(formData.get("companyName")),
      cauNumber: toOptionalString(formData.get("cauNumber")),
      website: toOptionalString(formData.get("website")),
      bio: toOptionalString(formData.get("bio"))
    });
  }

  async function onProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setProjectFormError(null);

    try {
      requireProjectImage(formData, "frontFile", "Fachada / frente");
      requireProjectImage(formData, "modelFile", "Vista do modelo");
      requireProjectImage(formData, "floorPlanFile", "Planta baixa");
      requireProjectImage(formData, "measurementsFile", "Medidas do projeto");
    } catch (error) {
      setProjectFormError(errorMessage(error));
      return;
    }

    let frontUrl = "";
    let modelUrl = "";
    let floorPlanUrl = "";
    let measurementsUrl = "";

    try {
      [frontUrl, modelUrl, floorPlanUrl, measurementsUrl] = await Promise.all([
        formDataImageValue(formData, "frontFile"),
        formDataImageValue(formData, "modelFile"),
        formDataImageValue(formData, "floorPlanFile"),
        formDataImageValue(formData, "measurementsFile")
      ]);
    } catch (error) {
      setProjectFormError(errorMessage(error));
      return;
    }

    const input: CreateProjectInput = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      style: toOptionalString(formData.get("style")),
      bedrooms: toNumber(formData.get("bedrooms")),
      bathrooms: toNumber(formData.get("bathrooms")),
      suites: toNumber(formData.get("suites")),
      parkingSpaces: toNumber(formData.get("parkingSpaces")),
      floors: Math.max(toNumber(formData.get("floors")), 1),
      areaM2: toNumber(formData.get("areaM2")),
      estimatedBuildCost: toNumber(formData.get("estimatedBuildCost")),
      price: toNumber(formData.get("price"))
    };

    const images: PendingProjectImage[] = [
      frontUrl
        ? {
            url: frontUrl,
            altText: "Fachada frontal do projeto",
            sortOrder: 0,
            isCover: true
          }
        : null,
      modelUrl
        ? {
            url: modelUrl,
            altText: "Vista do modelo do projeto",
            sortOrder: 1
          }
        : null,
      floorPlanUrl
        ? {
            url: floorPlanUrl,
            altText: "Planta baixa do projeto",
            sortOrder: 2
          }
        : null,
      measurementsUrl
        ? {
            url: measurementsUrl,
            altText: "Medidas do projeto",
            sortOrder: 3
          }
        : null
    ].filter(Boolean) as PendingProjectImage[];

    createProjectMutation.mutate({ input, images }, {
      onError: (error) => setProjectFormError(errorMessage(error)),
      onSuccess: () => {
        form.reset();
        setProjectFormError(null);
        setActiveWorkspace("projects");
      }
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--accent)]">Painel arquiteto</p>
          <h1 className="mt-3 text-4xl font-semibold">
            {profile?.companyName ?? profile?.user.name ?? "Studio"}
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Complete seu perfil, publique projetos aprovados e acompanhe a vitrine do marketplace.
          </p>
        </div>
        <Link href="/projetos">
          <Button type="button" variant="ghost">
            <ExternalLink size={18} />
            Ver marketplace
          </Button>
        </Link>
      </div>

      <div
        className={`mt-8 rounded-[8px] border p-5 ${
          isApproved ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            {isApproved ? <CheckCircle2 className="text-emerald-600" size={24} /> : <Clock className="text-amber-600" size={24} />}
            <div>
              <h2 className="text-xl font-semibold">{isApproved ? "Perfil aprovado" : "Perfil aguardando aprovacao"}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {isApproved
                  ? "Voce ja pode publicar projetos e eles entram direto na vitrine."
                  : "Complete seus dados profissionais. O admin aprova o perfil antes de liberar publicacao."}
              </p>
            </div>
          </div>
          {!isApproved ? (
            <Link className="text-sm font-semibold text-[var(--accent)]" href="/admin">
              Testar aprovacao no admin
            </Link>
          ) : null}
        </div>
      </div>

      {profileQuery.isError || statsQuery.isError ? (
        <div className="mt-8 rounded-[8px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
          Falha ao carregar o painel do arquiteto: {errorMessage(profileQuery.error ?? statsQuery.error)}. Verifique se a API e o PostgreSQL estao rodando.
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MetricCard icon={Building2} label="Projetos ativos" value={String(stats?.projects ?? projects.length)} />
        <MetricCard icon={Wallet} label="Pedidos pagos" value={String(stats?.paidOrders ?? 0)} />
        <MetricCard icon={BarChart3} label="Conversao" value={`${Math.round((stats?.conversionRate ?? 0) * 100)}%`} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="self-start rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase text-[var(--muted)]">Trabalho</p>
          <div className="mt-3 grid gap-2">
            {[
              { id: "projects" as const, icon: Building2, label: "Meus projetos", helper: `${projects.length} publicados` },
              { id: "new-project" as const, icon: Upload, label: "Novo projeto", helper: isApproved ? "Enviar modelo" : "Aguardando aprovacao" },
              { id: "profile" as const, icon: FileText, label: "Perfil", helper: profile?.cauNumber ? "Dados completos" : "Completar dados" }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkspace === item.id;

              return (
                <button
                  className={`focus-ring rounded-[8px] border px-3 py-3 text-left transition ${
                    isActive
                      ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                      : "border-[var(--line)] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                  key={item.id}
                  onClick={() => setActiveWorkspace(item.id)}
                  type="button"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="text-[var(--accent)]" size={17} />
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">{item.helper}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-3 text-sm">
            <p className="font-semibold">Checklist rapido</p>
            <div className="mt-3 grid gap-2 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-2">
                <CheckCircle2 className={profile?.companyName ? "text-emerald-600" : "text-[var(--muted)]"} size={15} />
                Perfil profissional
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className={isApproved ? "text-emerald-600" : "text-[var(--muted)]"} size={15} />
                Aprovacao do admin
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className={projects.length ? "text-emerald-600" : "text-[var(--muted)]"} size={15} />
                Primeiro projeto
              </span>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {activeWorkspace === "profile" ? (
            <form
              className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5"
              key={profile?.id ?? "profile"}
              onSubmit={onProfileSubmit}
            >
              <div className="mb-5 flex items-center gap-2">
                <FileText className="text-[var(--accent)]" size={21} />
                <div>
                  <p className="text-sm uppercase text-[var(--muted)]">Perfil</p>
                  <h2 className="text-2xl font-semibold">Dados profissionais</h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input defaultValue={profile?.companyName ?? ""} name="companyName" placeholder="Nome do estudio ou escritorio" required />
                <Input defaultValue={profile?.cauNumber ?? ""} name="cauNumber" placeholder="CAU ou registro profissional" />
                <Input className="md:col-span-2" defaultValue={profile?.website ?? ""} name="website" placeholder="Site ou portfolio" />
                <textarea className={`${textAreaClass()} md:col-span-2`} defaultValue={profile?.bio ?? ""} name="bio" placeholder="Resumo do perfil profissional" />
                {updateProfileMutation.isSuccess ? <p className="text-sm text-emerald-600 md:col-span-2">Perfil atualizado.</p> : null}
                {updateProfileMutation.isError ? (
                  <p className="text-sm text-red-600 md:col-span-2">Nao foi possivel atualizar o perfil: {errorMessage(updateProfileMutation.error)}</p>
                ) : null}
                <Button className="md:justify-self-start" disabled={updateProfileMutation.isPending} type="submit" variant="secondary">
                  <CheckCircle2 size={18} />
                  {updateProfileMutation.isPending ? "Salvando..." : "Salvar perfil"}
                </Button>
              </div>
            </form>
          ) : null}

          {activeWorkspace === "new-project" ? (
            <form className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5" onSubmit={onProjectSubmit}>
              <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <Upload className="text-[var(--accent)]" size={21} />
                  <div>
                    <p className="text-sm uppercase text-[var(--muted)]">Projeto</p>
                    <h2 className="text-2xl font-semibold">Publicar novo projeto</h2>
                  </div>
                </div>
                {!isApproved ? <span className="w-fit rounded-[8px] bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">Bloqueado</span> : null}
              </div>

              <fieldset className="grid gap-5 disabled:opacity-60" disabled={!isApproved || createProjectMutation.isPending}>
                <div className="rounded-[8px] border border-[var(--line)] p-4">
                  <p className="mb-3 text-sm font-semibold">1. Dados principais</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input name="title" placeholder="Nome do projeto" required />
                    <select className={selectClass()} defaultValue="Contemporaneo" name="style">
                      <option>Contemporaneo</option>
                      <option>Minimalista</option>
                      <option>Classico</option>
                      <option>Rustico</option>
                      <option>Industrial</option>
                    </select>
                    <Input inputMode="numeric" min={0} name="bedrooms" placeholder="Quartos" required type="number" />
                    <Input inputMode="numeric" min={0} name="bathrooms" placeholder="Banheiros" required type="number" />
                    <Input inputMode="decimal" min={1} name="areaM2" placeholder="Area m2" required type="number" />
                    <CurrencyInput name="price" placeholder="Preco do projeto" required />
                    <CurrencyInput name="estimatedBuildCost" placeholder="Custo estimado da obra" required />
                    <textarea className={`${textAreaClass()} md:col-span-2`} name="description" placeholder="Descricao do projeto" required />
                  </div>
                </div>

                <div className="rounded-[8px] border border-[var(--line)] p-4">
                  <div className="mb-3 flex flex-col justify-between gap-1 md:flex-row md:items-end">
                    <div>
                      <p className="text-sm font-semibold">2. Imagens obrigatorias</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">Use imagens de ate {maxProjectImageSizeMb}MB cada. Elas aparecem na pagina do projeto.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      <span>Fachada / frente</span>
                      <Input accept="image/*" className={fileInputClass()} name="frontFile" required type="file" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      <span>Vista do modelo</span>
                      <Input accept="image/*" className={fileInputClass()} name="modelFile" required type="file" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      <span>Planta baixa</span>
                      <Input accept="image/*" className={fileInputClass()} name="floorPlanFile" required type="file" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      <span>Medidas do projeto</span>
                      <Input accept="image/*" className={fileInputClass()} name="measurementsFile" required type="file" />
                    </label>
                  </div>
                </div>

                <details className="rounded-[8px] border border-[var(--line)] p-4">
                  <summary className="cursor-pointer text-sm font-semibold">3. Mais dados</summary>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Input inputMode="numeric" min={0} name="suites" placeholder="Suites" type="number" />
                    <Input inputMode="numeric" min={0} name="parkingSpaces" placeholder="Vagas" type="number" />
                    <Input inputMode="numeric" min={1} name="floors" placeholder="Pavimentos" type="number" />
                  </div>
                </details>
              </fieldset>

              {createProjectMutation.isSuccess ? (
                <p className="mt-4 rounded-[8px] bg-emerald-500/10 p-3 text-sm text-emerald-700">
                  Projeto publicado e disponivel no marketplace.
                </p>
              ) : null}
              {projectFormError ? (
                <p className="mt-4 rounded-[8px] bg-red-500/10 p-3 text-sm text-red-600">
                  Nao foi possivel publicar: {projectFormError}
                </p>
              ) : null}

              <Button className="mt-5 w-full" disabled={!isApproved || createProjectMutation.isPending} type="submit" variant="secondary">
                <Upload size={18} />
                {createProjectMutation.isPending ? "Publicando..." : "Publicar projeto"}
              </Button>
            </form>
          ) : null}

          {activeWorkspace === "projects" ? (
            <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
              <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm uppercase text-[var(--muted)]">Catalogo</p>
                  <h2 className="text-2xl font-semibold">Meus projetos</h2>
                </div>
                <Button onClick={() => setActiveWorkspace("new-project")} type="button" variant="secondary">
                  <Upload size={18} />
                  Novo projeto
                </Button>
              </div>

              {profileQuery.isLoading ? (
                <div className="py-8 text-sm text-[var(--muted)]">Carregando projetos...</div>
              ) : projects.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {projects.map((project) => (
                    <div className="rounded-[8px] border border-[var(--line)] p-4" key={project.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase text-[var(--muted)]">{project.style ?? "Projeto"}</p>
                          <h3 className="mt-1 text-xl font-semibold">{project.title}</h3>
                        </div>
                        <span className="rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                          {statusLabel(project.status ?? "PUBLISHED")}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-[var(--muted)]">{project.description}</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
                        <span className="rounded-[8px] border border-[var(--line)] px-2 py-2">{area(project.areaM2)}</span>
                        <span className="rounded-[8px] border border-[var(--line)] px-2 py-2">{project.bedrooms} quartos</span>
                        <span className="rounded-[8px] border border-[var(--line)] px-2 py-2">{money(project.price)}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link className="inline-flex text-sm font-semibold text-[var(--accent)]" href={`/projetos/${project.id}`}>
                          Abrir projeto
                        </Link>
                        {terrainsQuery.isLoading ? <span className="text-sm text-[var(--muted)]">Carregando terrenos...</span> : null}
                      </div>
                      <ProjectTerrainFitForm project={project} terrains={terrains} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[8px] border border-[var(--line)] p-5">
                  <AlertTriangle className="text-[var(--accent-3)]" size={24} />
                  <h3 className="mt-4 text-xl font-semibold">Nenhum projeto carregado ainda</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Quando seu perfil estiver aprovado, publique o primeiro projeto por aqui.
                  </p>
                  <Button className="mt-4" disabled={!isApproved} onClick={() => setActiveWorkspace("new-project")} type="button" variant="secondary">
                    <Upload size={18} />
                    Cadastrar primeiro projeto
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
