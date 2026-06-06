"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Building2, Check, ClipboardList, CreditCard, Image as ImageIcon, Map, RefreshCw, ShieldAlert, Users, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SimulationRequestsPanel } from "@/components/dashboard/simulation-requests-panel";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  approveArchitect,
  approveTerrain,
  archiveTerrain,
  addAdminProjectImage,
  addAdminTerrainImage,
  getAdminEvents,
  getAdminMetrics,
  getAdminOverview,
  getAdminOrders,
  getAdminProjects,
  getAdminSimulations,
  getAdminTerrains,
  getAdminUsers,
  getArchitectsForReview,
  rejectArchitect,
  removeAdminProjectImage,
  removeAdminTerrainImage,
  updateAdminArchitect,
  updateAdminOrderStatus,
  updateAdminProject,
  updateAdminProjectStatus,
  updateAdminSimulationStatus,
  updateAdminTerrain,
  updateAdminTerrainStatus,
  updateAdminUser,
  updateAdminUserStatus
} from "@/services/admin";
import { formDataImageValue } from "@/lib/files";
import { getSiteSettings, updateSiteSettings } from "@/services/settings";
import { useAuthStore } from "@/stores/auth-store";
import { area, money } from "@/lib/format";
import { ArchitectStatus, OrderStatus, ProjectStatus, SimulationStatus, TerrainStatus, UserRole, UserStatus } from "@/types/domain";

function colorDistance(data: Uint8ClampedArray, index: number, background: { r: number; g: number; b: number }) {
  return Math.abs(data[index] - background.r) + Math.abs(data[index + 1] - background.g) + Math.abs(data[index + 2] - background.b);
}

function cropLogoDataUrl(source: string) {
  return new Promise<string>((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;

      const context = sourceCanvas.getContext("2d");
      if (!context || sourceCanvas.width === 0 || sourceCanvas.height === 0) {
        resolve(source);
        return;
      }

      context.drawImage(image, 0, 0);

      const { width, height } = sourceCanvas;
      const imageData = context.getImageData(0, 0, width, height);
      const { data } = imageData;
      const cornerIndexes = [0, width - 1, width * (height - 1), width * height - 1].map((pixel) => pixel * 4);
      const opaqueCorners = cornerIndexes.filter((index) => data[index + 3] > 20);
      const hasSolidBackground = opaqueCorners.length >= 2;
      const background = opaqueCorners.reduce(
        (acc, index) => ({
          r: acc.r + data[index],
          g: acc.g + data[index + 1],
          b: acc.b + data[index + 2]
        }),
        { r: 0, g: 0, b: 0 }
      );

      if (hasSolidBackground) {
        background.r = Math.round(background.r / opaqueCorners.length);
        background.g = Math.round(background.g / opaqueCorners.length);
        background.b = Math.round(background.b / opaqueCorners.length);
      }

      const threshold = 34;
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 4;
          const alpha = data[index + 3];
          const visible = alpha > 20 && (!hasSolidBackground || colorDistance(data, index, background) > threshold);

          if (visible) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (minX > maxX || minY > maxY) {
        resolve(source);
        return;
      }

      const padding = Math.max(16, Math.round(Math.min(width, height) * 0.025));
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
      const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);
      const crop = context.getImageData(cropX, cropY, cropWidth, cropHeight);

      if (hasSolidBackground) {
        for (let index = 0; index < crop.data.length; index += 4) {
          const alpha = crop.data[index + 3];
          if (alpha <= 20 || colorDistance(crop.data, index, background) <= threshold) {
            crop.data[index + 3] = 0;
          }
        }
      }

      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = cropWidth;
      outputCanvas.height = cropHeight;
      outputCanvas.getContext("2d")?.putImageData(crop, 0, 0);
      resolve(outputCanvas.toDataURL("image/png"));
    };

    image.onerror = () => resolve(source);
    image.src = source;
  });
}

function readLogoFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Arquivo de logo invalido."));
        return;
      }

      resolve(await cropLogoDataUrl(reader.result));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

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

function statusPill(status?: string) {
  const normalized = status ?? "-";
  const tone =
    normalized.includes("APPROVED") || normalized.includes("AVAILABLE") || normalized.includes("PUBLISHED") || normalized.includes("ACTIVE") || normalized.includes("PAID")
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : normalized.includes("PENDING") || normalized.includes("DRAFT") || normalized.includes("SENT")
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
        : normalized.includes("REJECTED") || normalized.includes("ARCHIVED") || normalized.includes("SUSPENDED") || normalized.includes("CANCELED")
          ? "border-red-500/30 bg-red-500/10 text-red-700"
          : "border-[var(--line)] text-[var(--muted)]";

  return <span className={`inline-flex rounded-[8px] border px-2 py-1 text-xs font-semibold ${tone}`}>{normalized}</span>;
}

function panelClass() {
  return "scroll-mt-24 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5";
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Nao foi possivel carregar os dados agora.";
}

const userRoles: UserRole[] = ["CUSTOMER", "TERRAIN_OWNER", "ARCHITECT", "ADMIN"];
const userStatuses: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const architectStatuses: ArchitectStatus[] = ["PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"];

function inputClass() {
  return "focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none";
}

function fileInputClass() {
  return "focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm outline-none file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#11150f] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white";
}

function textareaClass() {
  return "focus-ring min-h-24 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm outline-none";
}

function formText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = formText(formData, key);
  return value.length ? value : undefined;
}

function formNumber(formData: FormData, key: string) {
  const raw = formText(formData, key);
  const value = Number(raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return raw.length && Number.isFinite(value) ? value : undefined;
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [selectedLightLogoUrl, setSelectedLightLogoUrl] = useState<string | null>(null);
  const [selectedDarkLogoUrl, setSelectedDarkLogoUrl] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

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

  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getAdminOverview,
    enabled: Boolean(accessToken && isAdmin)
  });

  const settingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    enabled: Boolean(accessToken && isAdmin)
  });

  const adminUsersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => getAdminUsers({ limit: 50 }),
    enabled: Boolean(accessToken && isAdmin)
  });

  const adminTerrainsQuery = useQuery({
    queryKey: ["admin", "terrains"],
    queryFn: () => getAdminTerrains({ limit: 50 }),
    enabled: Boolean(accessToken && isAdmin)
  });

  const adminProjectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => getAdminProjects({ limit: 50 }),
    enabled: Boolean(accessToken && isAdmin)
  });

  const adminSimulationsQuery = useQuery({
    queryKey: ["admin", "simulations"],
    queryFn: () => getAdminSimulations({ limit: 50 }),
    enabled: Boolean(accessToken && isAdmin)
  });

  const adminOrdersQuery = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => getAdminOrders({ limit: 50 }),
    enabled: Boolean(accessToken && isAdmin)
  });

  const adminEventsQuery = useQuery({
    queryKey: ["admin", "events"],
    queryFn: () => getAdminEvents({ limit: 50 }),
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

  const approveTerrainMutation = useMutation({
    mutationFn: approveTerrain,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  const archiveTerrainMutation = useMutation({
    mutationFn: archiveTerrain,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  const settingsMutation = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: async () => {
      setSelectedLightLogoUrl(null);
      setSelectedDarkLogoUrl(null);
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    }
  });

  const userStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => updateAdminUserStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  const userUpdateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateAdminUser(id, {
        name: formText(formData, "name"),
        email: formText(formData, "email"),
        phone: formText(formData, "phone"),
        document: formText(formData, "document"),
        role: formText(formData, "role") as UserRole,
        status: formText(formData, "status") as UserStatus
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  const architectUpdateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateAdminArchitect(id, {
        companyName: formText(formData, "companyName"),
        cauNumber: formText(formData, "cauNumber"),
        website: formText(formData, "website"),
        bio: formText(formData, "bio"),
        rejectionReason: formText(formData, "rejectionReason"),
        status: formText(formData, "status") as ArchitectStatus
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  const terrainStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TerrainStatus }) => updateAdminTerrainStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["terrains"] });
    }
  });

  const terrainUpdateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateAdminTerrain(id, {
        title: formText(formData, "title"),
        description: formText(formData, "description"),
        address: formText(formData, "address"),
        neighborhood: optionalText(formData, "neighborhood"),
        city: formText(formData, "city"),
        state: formText(formData, "state"),
        zipCode: optionalText(formData, "zipCode"),
        zoning: optionalText(formData, "zoning"),
        areaM2: formNumber(formData, "areaM2"),
        frontageM: formNumber(formData, "frontageM"),
        depthM: formNumber(formData, "depthM"),
        price: formNumber(formData, "price")
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["terrains"] });
    }
  });

  const terrainImageMutation = useMutation({
    mutationFn: async ({ terrainId, formData }: { terrainId: string; formData: FormData }) => {
      const url = await formDataImageValue(formData, "file");

      if (!url) {
        throw new Error("Selecione uma foto do terreno.");
      }

      return addAdminTerrainImage(terrainId, {
        url,
        altText: optionalText(formData, "altText"),
        sortOrder: 0,
        isCover: formData.get("isCover") === "on"
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["terrains"] });
    }
  });

  const removeTerrainImageMutation = useMutation({
    mutationFn: removeAdminTerrainImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["terrains"] });
    }
  });

  const projectStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) => updateAdminProjectStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  const projectUpdateMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
      fallbackRenderUrl,
      fallbackFloorPlanUrl
    }: {
      id: string;
      formData: FormData;
      fallbackRenderUrl?: string | null;
      fallbackFloorPlanUrl?: string | null;
    }) => {
      const renderUrl = await formDataImageValue(formData, "renderFile", fallbackRenderUrl ?? "");
      const floorPlanUrl = await formDataImageValue(formData, "floorPlanFile", fallbackFloorPlanUrl ?? "");

      return updateAdminProject(id, {
        title: formText(formData, "title"),
        description: formText(formData, "description"),
        style: optionalText(formData, "style"),
        bedrooms: formNumber(formData, "bedrooms"),
        bathrooms: formNumber(formData, "bathrooms"),
        suites: formNumber(formData, "suites"),
        parkingSpaces: formNumber(formData, "parkingSpaces"),
        floors: formNumber(formData, "floors"),
        areaM2: formNumber(formData, "areaM2"),
        estimatedBuildCost: formNumber(formData, "estimatedBuildCost"),
        price: formNumber(formData, "price"),
        ...(renderUrl ? { renderUrl } : {}),
        ...(floorPlanUrl ? { floorPlanUrl } : {}),
        architectId: optionalText(formData, "architectId")
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  const projectImageMutation = useMutation({
    mutationFn: async ({ projectId, formData }: { projectId: string; formData: FormData }) => {
      const url = await formDataImageValue(formData, "file");

      if (!url) {
        throw new Error("Selecione uma imagem do projeto.");
      }

      return addAdminProjectImage(projectId, {
        url,
        altText: optionalText(formData, "altText"),
        sortOrder: 0,
        isCover: formData.get("isCover") === "on"
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  const removeProjectImageMutation = useMutation({
    mutationFn: removeAdminProjectImage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  const simulationStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SimulationStatus }) => updateAdminSimulationStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  const orderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateAdminOrderStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    }
  });

  const adminQueries = [
    metricsQuery,
    architectsQuery,
    overviewQuery,
    settingsQuery,
    adminUsersQuery,
    adminTerrainsQuery,
    adminProjectsQuery,
    adminSimulationsQuery,
    adminOrdersQuery,
    adminEventsQuery
  ];
  const failedAdminQuery = adminQueries.find((query) => query.isError);

  if (!hasHydrated) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <RefreshCw className="mx-auto animate-spin text-[var(--accent)]" size={34} />
          <h1 className="mt-4 text-2xl font-semibold">Carregando sessao</h1>
        </div>
      </section>
    );
  }

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
  const overview = overviewQuery.data;
  const pendingArchitects = architectsQuery.data ?? [];
  const settings = settingsQuery.data;
  const adminUsers = adminUsersQuery.data?.items ?? [];
  const adminTerrains = adminTerrainsQuery.data?.items ?? [];
  const adminProjects = adminProjectsQuery.data?.items ?? [];
  const adminSimulations = adminSimulationsQuery.data?.items ?? [];
  const adminOrders = adminOrdersQuery.data?.items ?? [];
  const adminEvents = adminEventsQuery.data?.items ?? [];
  const logoLightPreview = selectedLightLogoUrl ?? settings?.logoLightUrl ?? settings?.logoUrl ?? null;
  const logoDarkPreview = selectedDarkLogoUrl ?? settings?.logoDarkUrl ?? settings?.logoUrl ?? null;
  const adminNavItems = [
    { href: "#visao-geral", label: "Visao geral", icon: Activity },
    { href: "#marca", label: "Marca", icon: ImageIcon },
    { href: "#pessoas", label: "Pessoas", icon: Users, count: metrics?.users ?? "..." },
    { href: "#arquitetos", label: "Arquitetos", icon: Building2, count: metrics?.architects ?? "..." },
    { href: "#terrenos", label: "Terrenos", icon: Map, count: metrics?.terrains ?? "..." },
    { href: "#projetos", label: "Projetos", icon: ClipboardList, count: metrics?.projects ?? "..." },
    { href: "#simulacoes", label: "Simulacoes", icon: CreditCard, count: metrics?.simulations ?? "..." },
    { href: "#pedidos", label: "Pedidos", icon: CreditCard, count: metrics?.orders ?? "..." },
    { href: "#anuncios", label: "Anuncios", icon: ShieldAlert, count: overview?.terrainQueue.length ?? "..." },
    { href: "#acessos", label: "Acessos", icon: Activity, count: metrics?.siteEvents ?? "..." }
  ];

  function handleLogoFile(file: File | null | undefined, variant: "light" | "dark") {
    const setLogo = variant === "light" ? setSelectedLightLogoUrl : setSelectedDarkLogoUrl;

    if (!file) {
      setLogo(null);
      return;
    }

    void readLogoFile(file).then(setLogo).catch(() => setLogo(null));
  }

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 xl:sticky xl:top-24">
          <p className="text-sm font-semibold uppercase text-[var(--accent)]">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold">Central operacional</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Acompanhe clientes, proprietarios, arquitetos, terrenos, projetos, simulacoes e pedidos no mesmo lugar.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border border-[var(--line)] p-3">
              <p className="text-xs uppercase text-[var(--muted)]">Pessoas</p>
              <strong className="mt-2 block text-lg">{metrics?.users ?? "..."}</strong>
            </div>
            <div className="rounded-[8px] border border-[var(--line)] p-3">
              <p className="text-xs uppercase text-[var(--muted)]">Terrenos</p>
              <strong className="mt-2 block text-lg">{metrics?.terrains ?? "..."}</strong>
            </div>
            <div className="rounded-[8px] border border-[var(--line)] p-3">
              <p className="text-xs uppercase text-[var(--muted)]">Projetos</p>
              <strong className="mt-2 block text-lg">{metrics?.projects ?? "..."}</strong>
            </div>
            <div className="rounded-[8px] border border-[var(--line)] p-3">
              <p className="text-xs uppercase text-[var(--muted)]">Pedidos</p>
              <strong className="mt-2 block text-lg">{metrics?.orders ?? "..."}</strong>
            </div>
          </div>

          <nav className="mt-6 grid gap-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  className="focus-ring flex items-center justify-between gap-3 rounded-[8px] border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-black/5 dark:hover:bg-white/10"
                  href={item.href}
                  key={item.href}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon size={16} />
                    {item.label}
                  </span>
                  {"count" in item ? (
                    <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-1 text-xs text-[var(--accent)]">
                      {item.count}
                    </span>
                  ) : null}
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-8">
          <div className="scroll-mt-24 flex flex-col justify-between gap-4 md:flex-row md:items-end" id="visao-geral">
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
                void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
              }}
              type="button"
              variant="ghost"
            >
              <RefreshCw size={18} />
              Atualizar
            </Button>
          </div>

          {failedAdminQuery ? (
            <div className="rounded-[8px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
              Falha ao carregar parte do admin: {errorMessage(failedAdminQuery.error)}. Verifique se a API e o PostgreSQL estao rodando e clique em Atualizar.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-9">
            <MetricCard icon={Users} label="Usuarios" value={String(metrics?.users ?? "...")} />
            <MetricCard icon={Building2} label="Arquitetos" value={String(metrics?.architects ?? "...")} />
            <MetricCard icon={ShieldAlert} label="Pendentes" value={String(metrics?.pendingArchitects ?? "...")} />
            <MetricCard icon={Map} label="Terrenos" value={String(metrics?.terrains ?? "...")} />
            <MetricCard icon={Map} label="Anuncios" value={String(metrics?.pendingTerrains ?? "...")} />
            <MetricCard icon={Building2} label="Projetos" value={String(metrics?.projects ?? "...")} />
            <MetricCard icon={ClipboardList} label="Simulacoes" value={String(metrics?.simulations ?? "...")} />
            <MetricCard icon={Activity} label="Visitas" value={String(metrics?.siteEvents ?? "...")} />
            <MetricCard icon={CreditCard} label="GMV" value={metrics ? money(metrics.grossMerchandiseValue) : "..."} />
          </div>

          <form
            className="scroll-mt-24 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5"
            id="marca"
            key={`${settings?.brandName ?? "brand"}-${settings?.logoLightUrl ?? settings?.logoUrl ?? "light"}-${settings?.logoDarkUrl ?? "dark"}`}
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              settingsMutation.mutate({
                brandName: String(formData.get("brandName") ?? "").trim(),
                logoLightUrl: selectedLightLogoUrl ?? String(formData.get("logoLightUrl") ?? "").trim(),
                logoDarkUrl: selectedDarkLogoUrl ?? String(formData.get("logoDarkUrl") ?? "").trim()
              });
            }}
          >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-2">
              <ImageIcon className="text-[var(--accent)]" size={22} />
              <div>
                <p className="text-sm uppercase text-[var(--muted)]">Aparencia</p>
                <h2 className="mt-1 text-2xl font-semibold">Logo do site</h2>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              A primeira logo aparece no tema claro. A segunda aparece no tema escuro. Imagens grandes sao recortadas
              automaticamente antes de salvar.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto">
            <div className="rounded-[8px] border border-[var(--line)] bg-white p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-[#656b61]">Tema claro</p>
              <div className="flex h-16 w-full min-w-48 items-center justify-center overflow-hidden">
                {logoLightPreview ? (
                  <img alt={`${settings?.brandName ?? "Logo"} tema claro`} className="h-full w-full object-contain" src={logoLightPreview} />
                ) : (
                  <span className="text-sm text-[#656b61]">Sem logo</span>
                )}
              </div>
            </div>
            <div className="rounded-[8px] border border-[#293126] bg-[#10120f] p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-[#a5ad9f]">Tema escuro</p>
              <div className="flex h-16 w-full min-w-48 items-center justify-center overflow-hidden">
                {logoDarkPreview ? (
                  <img alt={`${settings?.brandName ?? "Logo"} tema escuro`} className="h-full w-full object-contain" src={logoDarkPreview} />
                ) : (
                  <span className="text-sm text-[#a5ad9f]">Sem logo</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[240px_1fr_1fr]">
          <label>
            <span className="mb-1 block text-sm font-semibold">Nome da marca</span>
            <input
              className="focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none"
              defaultValue={settings?.brandName ?? "Ce constroi"}
              name="brandName"
              placeholder="Nome da marca"
            />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">URL tema claro</span>
            <input
              className="focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none"
              defaultValue={settings?.logoLightUrl ?? settings?.logoUrl ?? ""}
              name="logoLightUrl"
              placeholder="/brand/logo-light.svg"
            />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">URL tema escuro</span>
            <input
              className="focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none"
              defaultValue={settings?.logoDarkUrl ?? settings?.logoUrl ?? ""}
              name="logoDarkUrl"
              placeholder="/brand/logo-dark.svg"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label>
            <span className="mb-1 block text-sm font-semibold">Enviar logo do tema claro</span>
            <input
              accept="image/*"
              className={fileInputClass()}
              onChange={(event) => handleLogoFile(event.target.files?.[0], "light")}
              type="file"
            />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">Enviar logo do tema escuro</span>
            <input
              accept="image/*"
              className={fileInputClass()}
              onChange={(event) => handleLogoFile(event.target.files?.[0], "dark")}
              type="file"
            />
          </label>
          <div className="flex items-end">
            <Button className="w-full md:w-auto" disabled={settingsMutation.isPending} type="submit" variant="secondary">
              <Check size={18} />
              {settingsMutation.isPending ? "Salvando..." : "Salvar logos"}
            </Button>
          </div>
        </div>
        {settingsMutation.isSuccess ? <p className="mt-3 text-sm text-emerald-600">Logos atualizadas no site.</p> : null}
        {settingsMutation.isError ? <p className="mt-3 text-sm text-red-600">Nao foi possivel salvar as logos.</p> : null}
      </form>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className={panelClass()} id="pessoas">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Banco de dados</p>
              <h2 className="mt-1 text-2xl font-semibold">Clientes, arquitetos e proprietarios</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {adminUsersQuery.data?.meta.total ?? 0}
            </span>
          </div>

          <div className="mt-5 divide-y divide-[var(--line)]">
            {adminUsersQuery.isLoading ? (
              <div className="py-8 text-sm text-[var(--muted)]">Carregando usuarios...</div>
            ) : adminUsers.length ? (
              adminUsers.map((adminUser) => {
                const architectProfile = adminUser.architectProfile;

                return (
                  <div className="py-4" key={adminUser.id}>
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{adminUser.name}</h3>
                          {statusPill(adminUser.status)}
                          {statusPill(adminUser.role)}
                          {architectProfile ? statusPill(architectProfile.status) : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">{adminUser.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                          <span>{adminUser.phone ?? "Sem telefone"}</span>
                          <span>Terrenos {adminUser._count?.ownedTerrains ?? 0}</span>
                          <span>Simulacoes {adminUser._count?.simulations ?? 0}</span>
                          <span>Pedidos {adminUser._count?.orders ?? 0}</span>
                          <span>Acessos {adminUser._count?.siteEvents ?? 0}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <Button
                          disabled={userStatusMutation.isPending}
                          onClick={() =>
                            userStatusMutation.mutate({
                              id: adminUser.id,
                              status: adminUser.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                            })
                          }
                          type="button"
                          variant="ghost"
                        >
                          {adminUser.status === "ACTIVE" ? "Suspender" : "Ativar"}
                        </Button>
                        {architectProfile && architectProfile.status !== "APPROVED" ? (
                          <Button
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(architectProfile.id)}
                            type="button"
                            variant="secondary"
                          >
                            <Check size={18} />
                            Aprovar
                          </Button>
                        ) : null}
                        {architectProfile && (architectProfile.status === "APPROVED" || architectProfile.status === "PENDING_REVIEW") ? (
                          <Button
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate(architectProfile.id)}
                            type="button"
                            variant="ghost"
                          >
                            <X size={18} />
                            Recusar
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <details className="mt-4 rounded-[8px] border border-[var(--line)] p-4">
                      <summary className="cursor-pointer text-sm font-semibold">Editar cadastro</summary>
                      <form
                        className="mt-4 grid gap-3 md:grid-cols-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          userUpdateMutation.mutate({ id: adminUser.id, formData: new FormData(event.currentTarget) });
                        }}
                      >
                        <input className={inputClass()} defaultValue={adminUser.name} name="name" placeholder="Nome" required />
                        <input className={inputClass()} defaultValue={adminUser.email} name="email" placeholder="E-mail" required />
                        <input className={inputClass()} defaultValue={adminUser.phone ?? ""} name="phone" placeholder="Telefone" />
                        <input className={inputClass()} defaultValue={adminUser.document ?? ""} name="document" placeholder="Documento" />
                        <select className={inputClass()} defaultValue={adminUser.role} name="role">
                          {userRoles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <select className={inputClass()} defaultValue={adminUser.status} name="status">
                          {userStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <Button className="md:col-span-2" disabled={userUpdateMutation.isPending} type="submit" variant="secondary">
                          Salvar cadastro
                        </Button>
                      </form>
                    </details>

                    {architectProfile ? (
                      <details className="mt-3 rounded-[8px] border border-[var(--line)] p-4">
                        <summary className="cursor-pointer text-sm font-semibold">Editar arquiteto</summary>
                        <form
                          className="mt-4 grid gap-3 md:grid-cols-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            architectUpdateMutation.mutate({ id: architectProfile.id, formData: new FormData(event.currentTarget) });
                          }}
                        >
                          <input className={inputClass()} defaultValue={architectProfile.companyName ?? ""} name="companyName" placeholder="Nome do estudio" />
                          <input className={inputClass()} defaultValue={architectProfile.cauNumber ?? ""} name="cauNumber" placeholder="CAU" />
                          <input className={inputClass()} defaultValue={architectProfile.website ?? ""} name="website" placeholder="Site ou portfolio" />
                          <select className={inputClass()} defaultValue={architectProfile.status} name="status">
                            {architectStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <textarea className={`${textareaClass()} md:col-span-2`} defaultValue={architectProfile.bio ?? ""} name="bio" placeholder="Bio do arquiteto" />
                          <input className={`${inputClass()} md:col-span-2`} defaultValue={architectProfile.rejectionReason ?? ""} name="rejectionReason" placeholder="Motivo de recusa, se houver" />
                          <Button className="md:col-span-2" disabled={architectUpdateMutation.isPending} type="submit" variant="secondary">
                            Salvar arquiteto
                          </Button>
                        </form>
                      </details>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum usuario encontrado.</div>
            )}
          </div>
        </div>

        <div className={panelClass()} id="acessos">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Acessos</p>
              <h2 className="mt-1 text-2xl font-semibold">Visitas reais do site</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {adminEventsQuery.data?.meta.total ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {adminEventsQuery.isLoading ? (
              <div className="py-8 text-sm text-[var(--muted)]">Carregando acessos...</div>
            ) : adminEvents.length ? (
              adminEvents.slice(0, 12).map((event) => (
                <div className="py-3" key={event.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm">{event.path}</strong>
                    {statusPill(event.type)}
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {event.user?.name ?? "Visitante"} - {event.ip ?? "IP oculto"} - {dateTime(event.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhuma visita registrada ainda.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className={panelClass()} id="terrenos">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Catalogo</p>
              <h2 className="mt-1 text-2xl font-semibold">Todos os terrenos cadastrados</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {adminTerrainsQuery.data?.meta.total ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {adminTerrainsQuery.isLoading ? (
              <div className="py-8 text-sm text-[var(--muted)]">Carregando terrenos...</div>
            ) : adminTerrains.length ? (
              adminTerrains.map((terrain) => (
                <div className="py-4" key={terrain.id}>
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
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
                        <span>{terrain.owner?.name ?? "Admin/sem proprietario"}</span>
                        <span>Favoritos {terrain._count?.favorites ?? 0}</span>
                        <span>Simulacoes {terrain._count?.simulations ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Button
                        disabled={terrainStatusMutation.isPending}
                        onClick={() => terrainStatusMutation.mutate({ id: terrain.id, status: "AVAILABLE" })}
                        type="button"
                        variant="secondary"
                      >
                        Publicar
                      </Button>
                      <Button
                        disabled={terrainStatusMutation.isPending}
                        onClick={() => terrainStatusMutation.mutate({ id: terrain.id, status: "RESERVED" })}
                        type="button"
                        variant="ghost"
                      >
                        Reservar
                      </Button>
                      <Button
                        disabled={terrainStatusMutation.isPending}
                        onClick={() => terrainStatusMutation.mutate({ id: terrain.id, status: "ARCHIVED" })}
                        type="button"
                        variant="ghost"
                      >
                        Arquivar
                      </Button>
                    </div>
                  </div>

                  <details className="mt-4 rounded-[8px] border border-[var(--line)] p-4">
                    <summary className="cursor-pointer text-sm font-semibold">Editar terreno</summary>
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        terrainUpdateMutation.mutate({ id: terrain.id, formData: new FormData(event.currentTarget) });
                      }}
                    >
                      <input className={inputClass()} defaultValue={terrain.title} name="title" placeholder="Titulo" required />
                      <CurrencyInput defaultValue={String(terrain.price ?? "")} name="price" placeholder="Valor" />
                      <input className={inputClass()} defaultValue={String(terrain.areaM2)} name="areaM2" placeholder="Area total" type="number" />
                      <input className={inputClass()} defaultValue={terrain.city} name="city" placeholder="Cidade" required />
                      <input className={inputClass()} defaultValue={terrain.state} name="state" placeholder="Estado" required />
                      <textarea className={`${textareaClass()} md:col-span-2`} defaultValue={terrain.description} name="description" placeholder="Descricao curta" />
                      <details className="md:col-span-2 rounded-[8px] border border-[var(--line)] p-3">
                        <summary className="cursor-pointer text-sm font-semibold">Mais dados</summary>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <input className={inputClass()} defaultValue={terrain.address ?? ""} name="address" placeholder="Rua / avenida" required />
                          <input className={inputClass()} defaultValue={terrain.neighborhood ?? ""} name="neighborhood" placeholder="Bairro" />
                          <input className={inputClass()} defaultValue={terrain.zipCode ?? ""} name="zipCode" placeholder="CEP" />
                          <input className={inputClass()} defaultValue={String(terrain.frontageM ?? "")} name="frontageM" placeholder="Frente" type="number" />
                          <input className={inputClass()} defaultValue={String(terrain.depthM ?? "")} name="depthM" placeholder="Fundo" type="number" />
                          <input className={`${inputClass()} md:col-span-2`} defaultValue={terrain.zoning ?? ""} name="zoning" placeholder="Zoneamento" />
                        </div>
                      </details>
                      <Button className="md:col-span-2" disabled={terrainUpdateMutation.isPending} type="submit" variant="secondary">
                        Salvar terreno
                      </Button>
                    </form>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {terrain.images?.length ? (
                        terrain.images.map((image) => (
                          <div className="rounded-[8px] border border-[var(--line)] p-2" key={image.id ?? image.url}>
                            <img alt={image.altText ?? terrain.title} className="h-28 w-full rounded-[8px] object-cover" src={image.url} />
                            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                              <span>{image.isCover ? "Capa" : "Foto"}</span>
                              {image.id ? (
                                <button
                                  className="font-semibold text-red-600"
                                  disabled={removeTerrainImageMutation.isPending}
                                  onClick={() => removeTerrainImageMutation.mutate(image.id!)}
                                  type="button"
                                >
                                  Remover
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[8px] border border-[var(--line)] p-4 text-sm text-[var(--muted)]">Sem fotos cadastradas.</div>
                      )}
                    </div>

                    <form
                      className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]"
                      onSubmit={(event) => {
                        event.preventDefault();
                        terrainImageMutation.mutate({ terrainId: terrain.id, formData: new FormData(event.currentTarget) });
                        event.currentTarget.reset();
                      }}
                    >
                      <input className={fileInputClass()} accept="image/*" name="file" required type="file" />
                      <input className={inputClass()} name="altText" placeholder="Descricao da foto" />
                      <label className="flex h-11 items-center gap-2 text-sm">
                        <input name="isCover" type="checkbox" />
                        Capa
                      </label>
                      <Button className="md:col-span-3" disabled={terrainImageMutation.isPending} type="submit" variant="ghost">
                        Enviar foto
                      </Button>
                    </form>
                  </details>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum terreno cadastrado.</div>
            )}
          </div>
        </div>

        <div className={panelClass()} id="projetos">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Casas</p>
              <h2 className="mt-1 text-2xl font-semibold">Projetos de arquitetura</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {adminProjectsQuery.data?.meta.total ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {adminProjectsQuery.isLoading ? (
              <div className="py-8 text-sm text-[var(--muted)]">Carregando projetos...</div>
            ) : adminProjects.length ? (
              adminProjects.map((project) => (
                <div className="py-4" key={project.id}>
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{project.title}</h3>
                        {statusPill(project.status)}
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {project.architect?.companyName ?? project.architect?.user?.name ?? "Sem arquiteto"} - {project.style ?? "Sem estilo"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                        <span>{area(project.areaM2)}</span>
                        <span>{project.bedrooms} quartos</span>
                        <span>Projeto {money(project.price)}</span>
                        <span>Obra {money(project.estimatedBuildCost)}</span>
                        <span>Simulacoes {project._count?.simulations ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Button
                        disabled={projectStatusMutation.isPending}
                        onClick={() => projectStatusMutation.mutate({ id: project.id, status: "PUBLISHED" })}
                        type="button"
                        variant="secondary"
                      >
                        Publicar
                      </Button>
                      <Button
                        disabled={projectStatusMutation.isPending}
                        onClick={() => projectStatusMutation.mutate({ id: project.id, status: "PENDING_REVIEW" })}
                        type="button"
                        variant="ghost"
                      >
                        Revisar
                      </Button>
                      <Button
                        disabled={projectStatusMutation.isPending}
                        onClick={() => projectStatusMutation.mutate({ id: project.id, status: "ARCHIVED" })}
                        type="button"
                        variant="ghost"
                      >
                        Arquivar
                      </Button>
                    </div>
                  </div>

                  <details className="mt-4 rounded-[8px] border border-[var(--line)] p-4">
                    <summary className="cursor-pointer text-sm font-semibold">Editar projeto</summary>
                    <form
                      className="mt-4 grid gap-3 md:grid-cols-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        projectUpdateMutation.mutate({
                          id: project.id,
                          formData: new FormData(event.currentTarget),
                          fallbackRenderUrl: project.renderUrl,
                          fallbackFloorPlanUrl: project.floorPlanUrl
                        });
                      }}
                    >
                      <input className={inputClass()} defaultValue={project.title} name="title" placeholder="Titulo" required />
                      <input className={inputClass()} defaultValue={project.style ?? ""} name="style" placeholder="Estilo" />
                      <input className={inputClass()} defaultValue={String(project.bedrooms)} name="bedrooms" placeholder="Quartos" type="number" />
                      <input className={inputClass()} defaultValue={String(project.bathrooms)} name="bathrooms" placeholder="Banheiros" type="number" />
                      <input className={inputClass()} defaultValue={String(project.areaM2)} name="areaM2" placeholder="Area" type="number" />
                      <CurrencyInput defaultValue={String(project.price ?? "")} name="price" placeholder="Preco do projeto" />
                      <textarea className={`${textareaClass()} md:col-span-2`} defaultValue={project.description} name="description" placeholder="Descricao curta" />
                      <details className="md:col-span-2 rounded-[8px] border border-[var(--line)] p-3">
                        <summary className="cursor-pointer text-sm font-semibold">Mais dados e imagens</summary>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <input className={inputClass()} defaultValue={String(project.suites ?? "")} name="suites" placeholder="Suites" type="number" />
                          <input className={inputClass()} defaultValue={String(project.parkingSpaces ?? "")} name="parkingSpaces" placeholder="Vagas" type="number" />
                          <input className={inputClass()} defaultValue={String(project.floors ?? "")} name="floors" placeholder="Pavimentos" type="number" />
                          <CurrencyInput defaultValue={String(project.estimatedBuildCost ?? "")} name="estimatedBuildCost" placeholder="Custo da obra" />
                          <input accept="image/*" className={fileInputClass()} name="renderFile" type="file" />
                          <input accept="image/*" className={fileInputClass()} name="floorPlanFile" type="file" />
                          <input className={`${inputClass()} md:col-span-2`} defaultValue={project.architect?.id ?? ""} name="architectId" placeholder="ID do arquiteto" />
                        </div>
                      </details>
                      <Button className="md:col-span-2" disabled={projectUpdateMutation.isPending} type="submit" variant="secondary">
                        Salvar projeto
                      </Button>
                    </form>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {project.images?.length ? (
                        project.images.map((image) => (
                          <div className="rounded-[8px] border border-[var(--line)] p-2" key={image.id ?? image.url}>
                            <img alt={image.altText ?? project.title} className="h-28 w-full rounded-[8px] object-cover" src={image.url} />
                            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                              <span>{image.isCover ? "Capa" : "Foto"}</span>
                              {image.id ? (
                                <button
                                  className="font-semibold text-red-600"
                                  disabled={removeProjectImageMutation.isPending}
                                  onClick={() => removeProjectImageMutation.mutate(image.id!)}
                                  type="button"
                                >
                                  Remover
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[8px] border border-[var(--line)] p-4 text-sm text-[var(--muted)]">Sem fotos cadastradas.</div>
                      )}
                    </div>

                    <form
                      className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]"
                      onSubmit={(event) => {
                        event.preventDefault();
                        projectImageMutation.mutate({ projectId: project.id, formData: new FormData(event.currentTarget) });
                        event.currentTarget.reset();
                      }}
                    >
                      <input className={fileInputClass()} accept="image/*" name="file" required type="file" />
                      <input className={inputClass()} name="altText" placeholder="Descricao da imagem" />
                      <label className="flex h-11 items-center gap-2 text-sm">
                        <input name="isCover" type="checkbox" />
                        Capa
                      </label>
                      <Button className="md:col-span-3" disabled={projectImageMutation.isPending} type="submit" variant="ghost">
                        Enviar foto
                      </Button>
                    </form>
                  </details>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum projeto cadastrado.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className={panelClass()} id="simulacoes">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Propostas</p>
              <h2 className="mt-1 text-2xl font-semibold">Simulacoes e pre-propostas</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {adminSimulationsQuery.data?.meta.total ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {adminSimulationsQuery.isLoading ? (
              <div className="py-8 text-sm text-[var(--muted)]">Carregando propostas...</div>
            ) : adminSimulations.length ? (
              adminSimulations.map((simulation) => (
                <div className="grid gap-4 py-4 lg:grid-cols-[1fr_auto]" key={simulation.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{simulation.customer?.name ?? "Cliente nao vinculado"}</h3>
                      {statusPill(simulation.status)}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {simulation.terrain?.title ?? "Terreno manual"} {simulation.project ? `+ ${simulation.project.title}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                      <span>Total {money(simulation.totalAmount)}</span>
                      <span>Parcela {money(simulation.monthlyPayment)}</span>
                      <span>Entrada {money(simulation.downPayment)}</span>
                      <span>{dateTime(simulation.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      disabled={simulationStatusMutation.isPending}
                      onClick={() => simulationStatusMutation.mutate({ id: simulation.id, status: "SENT" })}
                      type="button"
                      variant="secondary"
                    >
                      Enviar
                    </Button>
                    <Button
                      disabled={simulationStatusMutation.isPending}
                      onClick={() => simulationStatusMutation.mutate({ id: simulation.id, status: "CONVERTED" })}
                      type="button"
                      variant="ghost"
                    >
                      Converter
                    </Button>
                    <Button
                      disabled={simulationStatusMutation.isPending}
                      onClick={() => simulationStatusMutation.mutate({ id: simulation.id, status: "EXPIRED" })}
                      type="button"
                      variant="ghost"
                    >
                      Expirar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhuma simulacao salva ainda.</div>
            )}
          </div>
        </div>

        <div className={panelClass()} id="pedidos">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Pedidos</p>
              <h2 className="mt-1 text-2xl font-semibold">Vendas e contratos</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {adminOrdersQuery.data?.meta.total ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {adminOrdersQuery.isLoading ? (
              <div className="py-8 text-sm text-[var(--muted)]">Carregando pedidos...</div>
            ) : adminOrders.length ? (
              adminOrders.map((order) => (
                <div className="grid gap-4 py-4 lg:grid-cols-[1fr_auto]" key={order.id}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{order.customer.name}</h3>
                      {statusPill(order.status)}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {order.terrain?.title ?? order.project?.title ?? "Pedido sem item"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                      <span>{money(order.total)}</span>
                      <span>{dateTime(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      disabled={orderStatusMutation.isPending}
                      onClick={() => orderStatusMutation.mutate({ id: order.id, status: "PENDING_PAYMENT" })}
                      type="button"
                      variant="secondary"
                    >
                      Cobrar
                    </Button>
                    <Button
                      disabled={orderStatusMutation.isPending}
                      onClick={() => orderStatusMutation.mutate({ id: order.id, status: "PAID" })}
                      type="button"
                      variant="ghost"
                    >
                      Pago
                    </Button>
                    <Button
                      disabled={orderStatusMutation.isPending}
                      onClick={() => orderStatusMutation.mutate({ id: order.id, status: "CANCELED" })}
                      type="button"
                      variant="ghost"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum pedido cadastrado ainda.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="scroll-mt-24 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5" id="arquitetos">
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

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="scroll-mt-24 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5" id="anuncios">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Anuncios</p>
              <h2 className="mt-1 text-2xl font-semibold">Terrenos para curadoria</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {overview?.terrainQueue.length ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {overviewQuery.isLoading ? (
              <div className="py-8 text-sm text-[var(--muted)]">Carregando anuncios...</div>
            ) : overview?.terrainQueue.length ? (
              overview.terrainQueue.map((terrain) => (
                <div className="grid gap-4 py-4 md:grid-cols-[1fr_auto]" key={terrain.id}>
                  <div>
                    <h3 className="font-semibold">{terrain.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {[terrain.neighborhood, terrain.city, terrain.state].filter(Boolean).join(", ")}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {money(terrain.price)} - {terrain.owner?.name ?? "Sem proprietario vinculado"}
                    </p>
                    <span className="mt-2 inline-flex rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                      {terrain.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Button
                      disabled={approveTerrainMutation.isPending}
                      onClick={() => approveTerrainMutation.mutate(terrain.id)}
                      type="button"
                      variant="secondary"
                    >
                      <Check size={18} />
                      Publicar
                    </Button>
                    <Button
                      disabled={archiveTerrainMutation.isPending}
                      onClick={() => archiveTerrainMutation.mutate(terrain.id)}
                      type="button"
                      variant="ghost"
                    >
                      <X size={18} />
                      Arquivar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum terreno pendente agora.</div>
            )}
          </div>
        </div>

        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[var(--muted)]">Operacao</p>
              <h2 className="mt-1 text-2xl font-semibold">Simulacoes salvas</h2>
            </div>
            <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
              {overview?.recentSimulations.length ?? 0}
            </span>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {overviewQuery.isLoading ? (
              <div className="py-8 text-sm text-[var(--muted)]">Carregando simulacoes...</div>
            ) : overview?.recentSimulations.length ? (
              overview.recentSimulations.map((simulation) => (
                <div className="py-4" key={simulation.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">{simulation.customer?.name ?? "Cliente nao vinculado"}</h3>
                    <span className="rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                      {simulation.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Parcela {money(simulation.monthlyPayment)} - Total {money(simulation.totalAmount)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {simulation.terrain?.title ?? "Sem terreno"} {simulation.project ? `+ ${simulation.project.title}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhuma simulacao salva na API ainda.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm uppercase text-[var(--muted)]">Usuarios</p>
          <h2 className="mt-1 text-2xl font-semibold">Cadastros recentes</h2>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {overview?.recentUsers.length ? (
              overview.recentUsers.map((recentUser) => (
                <div className="py-4" key={recentUser.id}>
                  <h3 className="font-semibold">{recentUser.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{recentUser.email}</p>
                  <span className="mt-2 inline-flex rounded-[8px] border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]">
                    {recentUser.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum usuario carregado.</div>
            )}
          </div>
        </div>

        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm uppercase text-[var(--muted)]">Pedidos</p>
          <h2 className="mt-1 text-2xl font-semibold">Pedidos recentes</h2>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {overview?.recentOrders.length ? (
              overview.recentOrders.map((order) => (
                <div className="py-4" key={order.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">{order.customer.name}</h3>
                    <strong>{money(order.total)}</strong>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {order.terrain?.title ?? order.project?.title ?? "Pedido sem item"} - {order.status}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-[var(--muted)]">Nenhum pedido recente.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SimulationRequestsPanel />
      </div>
        </div>
      </div>
    </section>
  );
}
