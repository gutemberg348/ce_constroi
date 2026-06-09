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
  return "focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm outline-none file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#11150f] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white";
}

type PendingProjectImage = {
  url: string;
  altText: string;
  sortOrder: number;
  isCover?: boolean;
};

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Nao foi possivel carregar o painel agora.";
}

function numberValue(value: number | string | undefined | null) {
  const parsed = Number(String(value ?? "0").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
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

function terrainSummary(terrain: Terrain) {
  return [terrain.neighborhood, terrain.city, terrain.state].filter(Boolean).join(", ");
}

function ProjectTerrainFitForm({ project, terrains }: { project: Project; terrains: Terrain[] }) {
  const queryClient = useQueryClient();
  const [selectedTerrainId, setSelectedTerrainId] = useState(terrains[0]?.id ?? "");
  const [terrainSearch, setTerrainSearch] = useState("");
  const [minArea, setMinArea] = useState("");
  const [minFrontage, setMinFrontage] = useState("");
  const [minDepth, setMinDepth] = useState("");
  const filteredTerrains = useMemo(() => {
    const search = terrainSearch.trim().toLowerCase();
    const minAreaValue = numberValue(minArea);
    const minFrontageValue = numberValue(minFrontage);
    const minDepthValue = numberValue(minDepth);

    return terrains.filter((terrain) => {
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

      return (
        (!search || searchable.includes(search)) &&
        (!minAreaValue || numberValue(terrain.areaM2) >= minAreaValue) &&
        (!minFrontageValue || numberValue(terrain.frontageM) >= minFrontageValue) &&
        (!minDepthValue || numberValue(terrain.depthM) >= minDepthValue)
      );
    });
  }, [terrains, terrainSearch, minArea, minFrontage, minDepth]);
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
    <details className="mt-4 rounded-[8px] border border-[var(--line)] p-4">
      <summary className="cursor-pointer text-sm font-semibold">Adequar a terreno</summary>
      {terrains.length ? (
        <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_120px_120px]">
            <Input
              onChange={(event) => setTerrainSearch(event.target.value)}
              placeholder="Buscar por cidade, bairro, rua ou metragem"
              value={terrainSearch}
            />
            <Input
              inputMode="numeric"
              min={0}
              onChange={(event) => setMinArea(event.target.value)}
              placeholder="Area min."
              type="number"
              value={minArea}
            />
            <Input
              inputMode="numeric"
              min={0}
              onChange={(event) => setMinFrontage(event.target.value)}
              placeholder="Frente min."
              type="number"
              value={minFrontage}
            />
            <Input
              inputMode="numeric"
              min={0}
              onChange={(event) => setMinDepth(event.target.value)}
              placeholder="Fundo min."
              type="number"
              value={minDepth}
            />
          </div>
          <p className="text-xs text-[var(--muted)]">
            {filteredTerrains.length} {filteredTerrains.length === 1 ? "terreno encontrado" : "terrenos encontrados"} para este filtro.
          </p>
          <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
            <select
              className={selectClass()}
              name="terrainId"
              onChange={(event) => setSelectedTerrainId(event.target.value)}
              value={selectedTerrainValue}
            >
              {filteredTerrains.length ? (
                filteredTerrains.map((terrain) => (
                  <option key={terrain.id} value={terrain.id}>
                    {terrain.title} - {terrainSummary(terrain)} - {area(terrain.areaM2)}
                  </option>
                ))
              ) : (
                <option value="">Nenhum terreno encontrado</option>
              )}
            </select>
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
            <Button disabled={compatibilityMutation.isPending || !selectedTerrainValue} type="submit" variant="secondary">
              <Map size={18} />
              Salvar adequacao
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

          <textarea
            className={textAreaClass()}
            name="notes"
            placeholder="Observacao para aparecer na pagina do terreno, por exemplo: projeto compacto com boa folga lateral."
          />

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

      await Promise.all(
        images.map((image) =>
          addProjectImage({
            projectId: project.id,
            url: image.url,
            altText: image.altText,
            sortOrder: image.sortOrder,
            isCover: image.isCover
          })
        )
      );

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
    const [frontUrl, modelUrl, floorPlanUrl, measurementsUrl] = await Promise.all([
      formDataImageValue(formData, "frontFile"),
      formDataImageValue(formData, "modelFile"),
      formDataImageValue(formData, "floorPlanFile"),
      formDataImageValue(formData, "measurementsFile")
    ]);

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

    if (frontUrl) {
      input.renderUrl = frontUrl;
    }

    if (floorPlanUrl) {
      input.floorPlanUrl = floorPlanUrl;
    }

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
      onSuccess: () => form.reset()
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

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
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
          <div className="grid gap-4">
            <Input defaultValue={profile?.companyName ?? ""} name="companyName" placeholder="Nome do estudio ou escritorio" required />
            <Input defaultValue={profile?.cauNumber ?? ""} name="cauNumber" placeholder="CAU ou registro profissional" />
            <Input defaultValue={profile?.website ?? ""} name="website" placeholder="Site ou portfolio" />
            <textarea className={textAreaClass()} defaultValue={profile?.bio ?? ""} name="bio" placeholder="Resumo do perfil profissional" />
            {updateProfileMutation.isSuccess ? <p className="text-sm text-emerald-600">Perfil atualizado.</p> : null}
            {updateProfileMutation.isError ? <p className="text-sm text-red-600">Nao foi possivel atualizar o perfil.</p> : null}
            <Button disabled={updateProfileMutation.isPending} type="submit" variant="secondary">
              <CheckCircle2 size={18} />
              {updateProfileMutation.isPending ? "Salvando..." : "Salvar perfil"}
            </Button>
          </div>
        </form>

        <form className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5" onSubmit={onProjectSubmit}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Upload className="text-[var(--accent)]" size={21} />
              <div>
                <p className="text-sm uppercase text-[var(--muted)]">Projeto</p>
                <h2 className="text-2xl font-semibold">Publicar novo projeto</h2>
              </div>
            </div>
            {!isApproved ? <span className="rounded-[8px] bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">Bloqueado</span> : null}
          </div>

          <fieldset className="grid gap-4 disabled:opacity-60" disabled={!isApproved || createProjectMutation.isPending}>
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
              <textarea
                className={`${textAreaClass()} md:col-span-2`}
                name="description"
                placeholder="Descricao do projeto"
                required
              />
            </div>
            <div className="rounded-[8px] border border-[var(--line)] p-3">
              <p className="mb-3 text-sm font-semibold">Imagens obrigatorias do projeto</p>
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
            <details className="rounded-[8px] border border-[var(--line)] p-3">
              <summary className="cursor-pointer text-sm font-semibold">Mais dados</summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
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
          {createProjectMutation.isError ? (
            <p className="mt-4 rounded-[8px] bg-red-500/10 p-3 text-sm text-red-600">
              Nao foi possivel publicar. Confira se o perfil esta aprovado e os campos estao completos.
            </p>
          ) : null}

          <Button className="mt-5 w-full" disabled={!isApproved || createProjectMutation.isPending} type="submit" variant="secondary">
            <Upload size={18} />
            {createProjectMutation.isPending ? "Publicando..." : "Publicar projeto"}
          </Button>
        </form>
      </div>

      <div className="mt-8 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase text-[var(--muted)]">Catalogo</p>
            <h2 className="text-2xl font-semibold">Meus projetos</h2>
          </div>
          <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
            {projects.length}
          </span>
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
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                  <span>{area(project.areaM2)}</span>
                  <span>{project.bedrooms} quartos</span>
                  <span>{money(project.price)}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link className="inline-flex text-sm font-semibold text-[var(--accent)]" href={`/projetos/${project.id}`}>
                    Abrir projeto
                  </Link>
                  {terrainsQuery.isLoading ? (
                    <span className="text-sm text-[var(--muted)]">Carregando terrenos...</span>
                  ) : null}
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
              Quando seu perfil estiver aprovado, use o formulario acima para publicar o primeiro projeto.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
