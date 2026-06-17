"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Ban,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Map,
  Newspaper,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Children, FormEvent, useMemo, useState } from "react";
import type { UrlObject } from "url";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProjectTerrainFitForm } from "@/components/dashboard/project-terrain-fit-form";
import { SimulationRequestsPanel } from "@/components/dashboard/simulation-requests-panel";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formDataImageValue, formDataLogoImageValue } from "@/lib/files";
import { area, money } from "@/lib/format";
import {
  getTerrainDevelopmentType,
  getTerrainPropertyDetails,
  terrainDevelopmentLabel,
  type TerrainDevelopmentType,
  withTerrainPropertyDetails
} from "@/lib/terrain-metadata";
import { getApiErrorMessage } from "@/services/api";
import {
  addAdminProjectImage,
  addAdminTerrainImage,
  approveArchitect,
  approveTerrain,
  archiveTerrain,
  createAdminArchitect,
  deleteAdminArchitect,
  deleteAdminProject,
  deleteAdminSimulation,
  deleteAdminTerrain,
  deleteAdminUser,
  getAdminEvents,
  getAdminMetrics,
  getAdminOrders,
  getAdminOverview,
  getAdminProjects,
  getAdminSimulations,
  getAllAdminTerrains,
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
import {
  createNewsPost,
  deleteNewsPost,
  getAdminNews,
  updateNewsPost
} from "@/services/news";
import { getSiteSettings, updateSiteSettings } from "@/services/settings";
import { useAuthStore } from "@/stores/auth-store";
import {
  AdminOrder,
  AdminSimulation,
  AdminUser,
  AssetImage,
  ArchitectProfile,
  ArchitectStatus,
  OrderStatus,
  NewsPost,
  NewsStatus,
  Project,
  ProjectStatus,
  SimulationStatus,
  Terrain,
  TerrainStatus,
  UserRole,
  UserStatus
} from "@/types/domain";
import { createTerrain, type CreateTerrainInput } from "@/services/terrains";

type AdminSection =
  | "dashboard"
  | "marca"
  | "clientes"
  | "proprietarios"
  | "arquitetos"
  | "terrenos"
  | "projetos"
  | "noticias"
  | "simulacoes"
  | "pedidos"
  | "anuncios"
  | "acessos";

type AdminNavItem = {
  id: AdminSection;
  href: UrlObject;
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const adminSections: AdminNavItem[] = [
  { id: "dashboard", href: { pathname: "/admin" }, path: "/admin", label: "Painel", description: "Numeros e filas principais", icon: Activity },
  { id: "clientes", href: { pathname: "/admin/clientes" }, path: "/admin/clientes", label: "Clientes", description: "Compradores e simulacoes", icon: Users },
  { id: "proprietarios", href: { pathname: "/admin/proprietarios" }, path: "/admin/proprietarios", label: "Proprietarios", description: "Donos de terrenos", icon: ShieldAlert },
  { id: "arquitetos", href: { pathname: "/admin/arquitetos" }, path: "/admin/arquitetos", label: "Arquitetos", description: "Aprovacao e curadoria", icon: Building2 },
  { id: "terrenos", href: { pathname: "/admin/terrenos" }, path: "/admin/terrenos", label: "Terrenos", description: "Catalogo de lotes", icon: Map },
  { id: "projetos", href: { pathname: "/admin/projetos" }, path: "/admin/projetos", label: "Projetos", description: "Casas e modelos", icon: ClipboardList },
  { id: "noticias", href: { pathname: "/admin/noticias" }, path: "/admin/noticias", label: "Noticias", description: "Conteudos e novidades", icon: Newspaper },
  { id: "simulacoes", href: { pathname: "/admin/simulacoes" }, path: "/admin/simulacoes", label: "Simulacoes", description: "Resultados financeiros", icon: CreditCard },
  { id: "pedidos", href: { pathname: "/admin/pedidos" }, path: "/admin/pedidos", label: "Pedidos", description: "Vendas e contratos", icon: FileText },
  { id: "anuncios", href: { pathname: "/admin/anuncios" }, path: "/admin/anuncios", label: "Anuncios", description: "Fila de terrenos", icon: ShieldAlert },
  { id: "acessos", href: { pathname: "/admin/acessos" }, path: "/admin/acessos", label: "Acessos", description: "Eventos do site", icon: Activity },
  {
    id: "marca",
    href: { pathname: "/admin/marca" },
    path: "/admin/marca",
    label: "Configurações",
    description: "Marca e CRECI padrão",
    icon: ImageIcon
  }
];

const userStatuses: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const architectStatuses: ArchitectStatus[] = ["PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"];
const terrainStatuses: TerrainStatus[] = ["DRAFT", "PENDING_REVIEW", "AVAILABLE", "RESERVED", "SOLD", "ARCHIVED"];
const projectStatuses: ProjectStatus[] = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"];
const simulationStatuses: SimulationStatus[] = ["DRAFT", "SENT", "CONVERTED", "EXPIRED"];

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function simulationFrontendResult(simulation: AdminSimulation) {
  return objectValue(objectValue(simulation.metadata).frontendResult);
}

function simulationCustomerFilled(simulation: AdminSimulation) {
  return objectValue(objectValue(simulation.metadata).customerFilled);
}

function simulationDisplayNumber(simulation: AdminSimulation, key: string, fallback: number | string) {
  return numberValue(simulationFrontendResult(simulation)[key]) ?? fallback;
}

function simulationCustomerName(simulation: AdminSimulation) {
  const customer = simulationCustomerFilled(simulation);
  return typeof customer.name === "string" && customer.name.trim()
    ? customer.name.trim()
    : simulation.customer?.name ?? "Cliente nao vinculado";
}

function simulationCustomerEmail(simulation: AdminSimulation) {
  const customer = simulationCustomerFilled(simulation);
  return typeof customer.email === "string" && customer.email.trim()
    ? customer.email.trim()
    : simulation.customer?.email ?? "Sem email";
}
const orderStatuses: OrderStatus[] = ["DRAFT", "PENDING_PAYMENT", "PAID", "CANCELED", "REFUNDED"];
const newsStatuses: NewsStatus[] = ["DRAFT", "PUBLISHED"];

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  ARCHITECT: "Arquiteto",
  CUSTOMER: "Cliente",
  TERRAIN_OWNER: "Proprietario"
};

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

function getAdminSection(pathname: string): AdminSection {
  const section = adminSections.find((item) => item.path !== "/admin" && (pathname === item.path || pathname.startsWith(`${item.path}/`)));
  return section?.id ?? "dashboard";
}

function statusLabel(status?: string) {
  return status ? (statusLabels[status] ?? status) : "-";
}

function statusPill(status?: string) {
  const normalized = status ?? "-";
  const tone =
    ["ACTIVE", "APPROVED", "AVAILABLE", "PUBLISHED", "PAID", "CONVERTED"].includes(normalized)
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : ["PENDING_REVIEW", "DRAFT", "SENT", "PENDING_PAYMENT", "RESERVED"].includes(normalized)
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
        : ["REJECTED", "ARCHIVED", "SUSPENDED", "CANCELED", "EXPIRED", "REFUNDED", "INACTIVE"].includes(normalized)
          ? "border-red-500/30 bg-red-500/10 text-red-700"
          : "border-[var(--line)] text-[var(--muted)]";

  return <span className={`inline-flex whitespace-nowrap rounded-[8px] border px-2 py-1 text-xs font-semibold ${tone}`}>{statusLabel(normalized)}</span>;
}

function inputClass() {
  return "focus-ring h-10 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none";
}

function selectClass() {
  return inputClass();
}

function textareaClass() {
  return "focus-ring min-h-24 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm outline-none";
}

function tableShellClass() {
  return "overflow-x-auto rounded-[8px] border border-[var(--line)]";
}

function panelClass() {
  return "rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5";
}

function formText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function hasFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return Boolean(value && typeof value !== "string" && value.size > 0);
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

function requiredFormNumber(formData: FormData, key: string, label: string) {
  const value = formNumber(formData, key);

  if (value === undefined) {
    throw new Error(`${label} e obrigatorio.`);
  }

  return value;
}

function hasFormImageInput(formData: FormData) {
  const imageFile = formData.get("imageFile");
  return Boolean(formText(formData, "imageUrl")) || Boolean(imageFile && typeof imageFile !== "string" && imageFile.size > 0);
}

async function formImageInput(formData: FormData) {
  const url = await formDataImageValue(formData, "imageFile", formText(formData, "imageUrl"));

  if (!url) {
    throw new Error("Envie um arquivo ou informe uma URL da imagem.");
  }

  return {
    url,
    storageKey: url,
    altText: optionalText(formData, "altText"),
    sortOrder: formNumber(formData, "sortOrder") ?? 0,
    isCover: formData.get("isCover") === "on"
  };
}

function dateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  return getApiErrorMessage(error, "Não foi possível carregar os dados agora.");
}

function confirmAction(message: string) {
  return typeof window !== "undefined" && window.confirm(message);
}

function AdminTable({
  columns,
  children,
  empty,
  isLoading
}: {
  columns: string[];
  children: React.ReactNode;
  empty: React.ReactNode;
  isLoading: boolean;
}) {
  const hasRows = Children.count(children) > 0;

  return (
    <div className={tableShellClass()}>
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="bg-[var(--background)] text-xs uppercase text-[var(--muted)]">
          <tr>
            {columns.map((column) => (
              <th className="border-b border-[var(--line)] px-4 py-3 font-semibold" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {isLoading ? (
            <tr>
              <td className="px-4 py-8 text-[var(--muted)]" colSpan={columns.length}>
                Carregando dados...
              </td>
            </tr>
          ) : hasRows ? (
            children
          ) : (
            <tr>
              <td className="px-4 py-8 text-[var(--muted)]" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
  tone = "default"
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-500/30 text-red-700 hover:bg-red-500/10"
      : tone === "success"
        ? "border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
        : "border-[var(--line)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10";

  return (
    <button
      className={`focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function EditPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-3">
      <summary className="cursor-pointer text-xs font-semibold">{label}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsSearch, setEventsSearch] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const activeSection = getAdminSection(pathname ?? "/admin");
  const activeConfig = adminSections.find((section) => section.id === activeSection) ?? adminSections[0];
  const isDashboard = activeSection === "dashboard";
  const userRoleForSection: UserRole | undefined =
    activeSection === "clientes" ? "CUSTOMER" : activeSection === "proprietarios" ? "TERRAIN_OWNER" : undefined;

  const metricsQuery = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: getAdminMetrics,
    enabled: Boolean(accessToken && isAdmin)
  });
  const overviewQuery = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: getAdminOverview,
    enabled: Boolean(accessToken && isAdmin && (isDashboard || activeSection === "anuncios"))
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users", userRoleForSection],
    queryFn: () => getAdminUsers({ limit: 100, role: userRoleForSection }),
    enabled: Boolean(accessToken && isAdmin && userRoleForSection)
  });
  const architectsQuery = useQuery({
    queryKey: ["admin", "architects"],
    queryFn: () => getArchitectsForReview(),
    enabled: Boolean(accessToken && isAdmin && activeSection === "arquitetos")
  });
  const terrainsQuery = useQuery({
    queryKey: ["admin", "terrains"],
    queryFn: () => getAllAdminTerrains(),
    enabled: Boolean(accessToken && isAdmin && (activeSection === "terrenos" || activeSection === "projetos"))
  });
  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => getAdminProjects({ limit: 100 }),
    enabled: Boolean(accessToken && isAdmin && activeSection === "projetos")
  });
  const newsQuery = useQuery({
    queryKey: ["admin", "news"],
    queryFn: () => getAdminNews({ limit: 100 }),
    enabled: Boolean(accessToken && isAdmin && activeSection === "noticias")
  });
  const simulationsQuery = useQuery({
    queryKey: ["admin", "simulations"],
    queryFn: () => getAdminSimulations({ limit: 100 }),
    enabled: Boolean(accessToken && isAdmin && activeSection === "simulacoes")
  });
  const ordersQuery = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => getAdminOrders({ limit: 100 }),
    enabled: Boolean(accessToken && isAdmin && activeSection === "pedidos")
  });
  const eventsQuery = useQuery({
    queryKey: ["admin", "events", eventsPage, eventsSearch],
    queryFn: () => getAdminEvents({ page: eventsPage, limit: 20, search: eventsSearch || undefined }),
    enabled: Boolean(accessToken && isAdmin && activeSection === "acessos")
  });
  const settingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    enabled: Boolean(accessToken && isAdmin && activeSection === "marca")
  });

  const invalidateAdmin = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
    await queryClient.invalidateQueries({ queryKey: ["terrains"] });
    await queryClient.invalidateQueries({ queryKey: ["projects"] });
    await queryClient.invalidateQueries({ queryKey: ["news"] });
    await queryClient.invalidateQueries({ queryKey: ["home", "news"] });
  };

  const userStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => updateAdminUserStatus(id, status),
    onSuccess: invalidateAdmin
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
    onSuccess: invalidateAdmin
  });
  const userDeleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: invalidateAdmin
  });

  const approveArchitectMutation = useMutation({ mutationFn: approveArchitect, onSuccess: invalidateAdmin });
  const rejectArchitectMutation = useMutation({
    mutationFn: (id: string) => rejectArchitect(id, "Perfil recusado pela administracao."),
    onSuccess: invalidateAdmin
  });
  const architectCreateMutation = useMutation({
    mutationFn: (formData: FormData) =>
      createAdminArchitect({
        name: formText(formData, "name"),
        email: formText(formData, "email"),
        password: formText(formData, "password"),
        phone: optionalText(formData, "phone"),
        companyName: optionalText(formData, "companyName"),
        cauNumber: optionalText(formData, "cauNumber"),
        website: optionalText(formData, "website"),
        bio: optionalText(formData, "bio"),
        status: formText(formData, "status") as ArchitectStatus
      }),
    onSuccess: invalidateAdmin
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
    onSuccess: invalidateAdmin
  });
  const architectBanMutation = useMutation({
    mutationFn: async ({ architectId, userId }: { architectId: string; userId: string }) => {
      await updateAdminArchitect(architectId, { status: "SUSPENDED" });
      return updateAdminUserStatus(userId, "SUSPENDED");
    },
    onSuccess: invalidateAdmin
  });
  const architectDeleteMutation = useMutation({ mutationFn: deleteAdminArchitect, onSuccess: invalidateAdmin });

  const terrainStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TerrainStatus }) => updateAdminTerrainStatus(id, status),
    onSuccess: invalidateAdmin
  });
  const terrainCreateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const input: CreateTerrainInput = {
        title: formText(formData, "title"),
        description: formText(formData, "description"),
        address: formText(formData, "address"),
        neighborhood: optionalText(formData, "neighborhood"),
        city: formText(formData, "city"),
        state: formText(formData, "state"),
        zipCode: optionalText(formData, "zipCode"),
        zoning: optionalText(formData, "zoning"),
        areaM2: requiredFormNumber(formData, "areaM2", "Area total"),
        frontageM: formNumber(formData, "frontageM"),
        depthM: formNumber(formData, "depthM"),
        price: requiredFormNumber(formData, "price", "Valor"),
        metadata: withTerrainPropertyDetails(
          undefined,
          {
            developmentType: formText(formData, "developmentType") as TerrainDevelopmentType,
            propertyType: optionalText(formData, "propertyType"),
            destination: optionalText(formData, "destination"),
            situation: optionalText(formData, "situation"),
            iptuValue: formNumber(formData, "iptuValue"),
            condominiumValue: formNumber(formData, "condominiumValue")
          }
        )
      };
      const terrain = await createTerrain(input);

      if (hasFormImageInput(formData)) {
        await addAdminTerrainImage(terrain.id, await formImageInput(formData));
      }

      return terrain;
    },
    onSuccess: invalidateAdmin
  });
  const terrainUpdateMutation = useMutation({
    mutationFn: ({
      id,
      formData,
      metadata
    }: {
      id: string;
      formData: FormData;
      metadata?: Record<string, unknown>;
    }) =>
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
        price: formNumber(formData, "price"),
        metadata: withTerrainPropertyDetails(
          metadata,
          {
            developmentType: formText(formData, "developmentType") as TerrainDevelopmentType,
            propertyType: optionalText(formData, "propertyType"),
            destination: optionalText(formData, "destination"),
            situation: optionalText(formData, "situation"),
            iptuValue: formNumber(formData, "iptuValue"),
            condominiumValue: formNumber(formData, "condominiumValue")
          }
        )
      }),
    onSuccess: invalidateAdmin
  });
  const terrainDeleteMutation = useMutation({ mutationFn: deleteAdminTerrain, onSuccess: invalidateAdmin });
  const approveTerrainMutation = useMutation({ mutationFn: approveTerrain, onSuccess: invalidateAdmin });
  const archiveTerrainMutation = useMutation({ mutationFn: archiveTerrain, onSuccess: invalidateAdmin });
  const terrainImageAddMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => addAdminTerrainImage(id, await formImageInput(formData)),
    onSuccess: invalidateAdmin
  });
  const terrainImageRemoveMutation = useMutation({
    mutationFn: removeAdminTerrainImage,
    onSuccess: invalidateAdmin
  });

  const projectStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) => updateAdminProjectStatus(id, status),
    onSuccess: invalidateAdmin
  });
  const projectUpdateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateAdminProject(id, {
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
        architectId: optionalText(formData, "architectId")
      }),
    onSuccess: invalidateAdmin
  });
  const projectDeleteMutation = useMutation({ mutationFn: deleteAdminProject, onSuccess: invalidateAdmin });
  const projectImageAddMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => addAdminProjectImage(id, await formImageInput(formData)),
    onSuccess: invalidateAdmin
  });
  const projectImageRemoveMutation = useMutation({
    mutationFn: removeAdminProjectImage,
    onSuccess: invalidateAdmin
  });

  const newsCreateMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      createNewsPost({
        title: formText(formData, "title"),
        excerpt: formText(formData, "excerpt"),
        content: formText(formData, "content"),
        imageUrl: await formDataImageValue(formData, "imageFile", formText(formData, "imageUrl")),
        author: optionalText(formData, "author"),
        status: formText(formData, "status") as NewsStatus
      }),
    onSuccess: invalidateAdmin
  });
  const newsUpdateMutation = useMutation({
    mutationFn: async ({ post, formData }: { post: NewsPost; formData: FormData }) =>
      updateNewsPost(post.id, {
        title: formText(formData, "title"),
        excerpt: formText(formData, "excerpt"),
        content: formText(formData, "content"),
        imageUrl: await formDataImageValue(formData, "imageFile", formText(formData, "imageUrl") || post.imageUrl || ""),
        author: optionalText(formData, "author"),
        status: formText(formData, "status") as NewsStatus
      }),
    onSuccess: invalidateAdmin
  });
  const newsDeleteMutation = useMutation({
    mutationFn: deleteNewsPost,
    onSuccess: invalidateAdmin
  });

  const simulationStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SimulationStatus }) => updateAdminSimulationStatus(id, status),
    onSuccess: invalidateAdmin
  });
  const simulationDeleteMutation = useMutation({ mutationFn: deleteAdminSimulation, onSuccess: invalidateAdmin });
  const orderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateAdminOrderStatus(id, status),
    onSuccess: invalidateAdmin
  });
  const settingsMutation = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: async () => {
      setLogoMessage("Marca atualizada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (error) => setLogoMessage(getApiErrorMessage(error, "Não foi possível salvar as configurações."))
  });

  const failedQuery = [
    metricsQuery,
    overviewQuery,
    usersQuery,
    architectsQuery,
    terrainsQuery,
    projectsQuery,
    newsQuery,
    simulationsQuery,
    ordersQuery,
    eventsQuery,
    settingsQuery
  ].find((query) => query.isError);

  const metrics = metricsQuery.data;
  const overview = overviewQuery.data;
  const users = usersQuery.data?.items ?? [];
  const architects = architectsQuery.data ?? [];
  const terrains = terrainsQuery.data?.items ?? [];
  const projects = projectsQuery.data?.items ?? [];
  const news = newsQuery.data?.items ?? [];
  const simulations = simulationsQuery.data?.items ?? [];
  const orders = ordersQuery.data?.items ?? [];
  const events = eventsQuery.data?.items ?? [];
  const eventsMeta = eventsQuery.data?.meta ?? { page: eventsPage, limit: 20, total: 0, totalPages: 1 };
  const newsTotal = newsQuery.data?.meta.total;

  const navItems = useMemo(
    () =>
      adminSections.map((item) => {
        const count =
          item.id === "clientes"
            ? metrics?.customers
            : item.id === "proprietarios"
              ? metrics?.terrainOwners
              : item.id === "arquitetos"
                ? metrics?.architects
                : item.id === "terrenos"
                  ? metrics?.terrains
                : item.id === "projetos"
                  ? metrics?.projects
                  : item.id === "noticias"
                    ? newsTotal
                    : item.id === "simulacoes"
                      ? metrics?.simulations
                      : item.id === "pedidos"
                        ? metrics?.orders
                        : item.id === "anuncios"
                          ? metrics?.pendingTerrains
                          : item.id === "acessos"
                            ? metrics?.siteEvents
                            : undefined;

        return { ...item, count };
      }),
    [metrics, newsTotal]
  );

  if (!hasHydrated) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className={panelClass()}>
          <h1 className="text-2xl font-semibold">Carregando sessao...</h1>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className={panelClass()}>
          <h1 className="text-2xl font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-[var(--muted)]">Entre com uma conta administradora para acessar esta area.</p>
        </div>
      </section>
    );
  }

  function submitLogo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentLogo = settingsQuery.data?.logoUrl ?? "";
    const currentLightLogo = settingsQuery.data?.logoLightUrl ?? currentLogo;
    const currentDarkLogo = settingsQuery.data?.logoDarkUrl ?? currentLogo;
    const hasLightFile = hasFile(formData, "logoLightFile");
    const hasDarkFile = hasFile(formData, "logoDarkFile");

    void Promise.all([
      formDataLogoImageValue(formData, "logoLightFile", currentLightLogo),
      formDataLogoImageValue(formData, "logoDarkFile", currentDarkLogo)
    ]).then(([logoLightUrl, logoDarkUrl]) => {
      const normalizedLightLogo = hasLightFile || !hasDarkFile ? logoLightUrl : logoDarkUrl;
      const normalizedDarkLogo = hasDarkFile || !hasLightFile ? logoDarkUrl : logoLightUrl;

      settingsMutation.mutate({
        brandName: formText(formData, "brandName"),
        logoLightUrl: normalizedLightLogo,
        logoDarkUrl: normalizedDarkLogo,
        defaultCreci: formText(formData, "defaultCreci")
      });
    });
  }

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 xl:sticky xl:top-24">
          <p className="text-sm font-semibold uppercase text-[var(--accent)]">Administracao</p>
          <h1 className="mt-2 text-3xl font-semibold">Central do Admin</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Cada area em uma pagina. Sem mistura, sem rolagem infinita.</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <SmallStat label="Clientes" value={metrics?.customers} />
            <SmallStat label="Proprietarios" value={metrics?.terrainOwners} />
            <SmallStat label="Terrenos" value={metrics?.terrains} />
            <SmallStat label="Projetos" value={metrics?.projects} />
          </div>

          <nav className="mt-6 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeSection;

              return (
                <Link
                  className={`focus-ring flex items-center justify-between gap-3 rounded-[8px] border px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]"
                      : "border-[var(--line)] text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                  href={item.href}
                  key={item.path}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Icon className="shrink-0" size={17} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.count !== undefined ? (
                    <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-1 text-xs text-[var(--accent)]">
                      {item.count ?? "..."}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-[var(--accent)]">{activeConfig.label}</p>
              <h2 className="mt-2 text-4xl font-semibold">{isDashboard ? "Visao geral da operacao" : activeConfig.description}</h2>
              <p className="mt-3 max-w-3xl text-[var(--muted)]">
                {isDashboard
                  ? "Numeros, filas e atividades recentes para acompanhar o marketplace."
                  : "Lista em tabela, acoes claras e edicao direta sem misturar com outros modulos."}
              </p>
            </div>
            <Button
              onClick={() => {
                void invalidateAdmin();
                void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
              }}
              type="button"
              variant="ghost"
            >
              <RefreshCw size={18} />
              Atualizar
            </Button>
          </div>

          {failedQuery ? (
            <div className="rounded-[8px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
              Falha ao carregar dados: {errorMessage(failedQuery.error)}
            </div>
          ) : null}

          {isDashboard ? (
            <DashboardSection metrics={metrics} overview={overview} isLoading={overviewQuery.isLoading || metricsQuery.isLoading} />
          ) : null}

          {activeSection === "clientes" || activeSection === "proprietarios" ? (
            <UsersSection
              deleteMutationPending={userDeleteMutation.isPending}
              isLoading={usersQuery.isLoading}
              onBan={(id) => userStatusMutation.mutate({ id, status: "SUSPENDED" })}
              onDelete={(id) => userDeleteMutation.mutate(id)}
              onReactivate={(id) => userStatusMutation.mutate({ id, status: "ACTIVE" })}
              onUpdate={(id, formData) => userUpdateMutation.mutate({ id, formData })}
              statusMutationPending={userStatusMutation.isPending}
              title={activeSection === "clientes" ? "Clientes cadastrados" : "Proprietarios de terrenos"}
              updateMutationPending={userUpdateMutation.isPending}
              users={users}
            />
          ) : null}

          {activeSection === "arquitetos" ? (
            <ArchitectsSection
              architects={architects}
              createError={architectCreateMutation.error}
              createPending={architectCreateMutation.isPending}
              createSuccess={architectCreateMutation.isSuccess}
              isLoading={architectsQuery.isLoading}
              onApprove={(id) => approveArchitectMutation.mutate(id)}
              onBan={(architectId, userId) => architectBanMutation.mutate({ architectId, userId })}
              onCreate={(formData) => architectCreateMutation.mutate(formData)}
              onDelete={(id) => architectDeleteMutation.mutate(id)}
              onReject={(id) => rejectArchitectMutation.mutate(id)}
              onUpdate={(id, formData) => architectUpdateMutation.mutate({ id, formData })}
              pending={
                architectCreateMutation.isPending ||
                approveArchitectMutation.isPending ||
                rejectArchitectMutation.isPending ||
                architectUpdateMutation.isPending ||
                architectBanMutation.isPending ||
                architectDeleteMutation.isPending
              }
            />
          ) : null}

          {activeSection === "terrenos" ? (
            <TerrainsSection
              createError={terrainCreateMutation.error}
              createPending={terrainCreateMutation.isPending}
              createSuccess={terrainCreateMutation.isSuccess}
              isLoading={terrainsQuery.isLoading}
              imageError={terrainImageAddMutation.error ?? terrainImageRemoveMutation.error}
              imagePending={terrainImageAddMutation.isPending || terrainImageRemoveMutation.isPending}
              onAddImage={(id, formData) => terrainImageAddMutation.mutate({ id, formData })}
              onApprove={(id) => approveTerrainMutation.mutate(id)}
              onArchive={(id) => archiveTerrainMutation.mutate(id)}
              onCreate={(formData) => terrainCreateMutation.mutate(formData)}
              onDelete={(id) => terrainDeleteMutation.mutate(id)}
              onRemoveImage={(id) => terrainImageRemoveMutation.mutate(id)}
              onStatus={(id, status) => terrainStatusMutation.mutate({ id, status })}
              onUpdate={(id, formData, metadata) => terrainUpdateMutation.mutate({ id, formData, metadata })}
              pending={
                terrainStatusMutation.isPending ||
                terrainCreateMutation.isPending ||
                terrainUpdateMutation.isPending ||
                terrainDeleteMutation.isPending ||
                terrainImageAddMutation.isPending ||
                terrainImageRemoveMutation.isPending
              }
              terrains={terrains}
            />
          ) : null}

          {activeSection === "projetos" ? (
            <ProjectsSection
              isLoading={projectsQuery.isLoading}
              imageError={projectImageAddMutation.error ?? projectImageRemoveMutation.error}
              imagePending={projectImageAddMutation.isPending || projectImageRemoveMutation.isPending}
              onAddImage={(id, formData) => projectImageAddMutation.mutate({ id, formData })}
              onDelete={(id) => projectDeleteMutation.mutate(id)}
              onRemoveImage={(id) => projectImageRemoveMutation.mutate(id)}
              onStatus={(id, status) => projectStatusMutation.mutate({ id, status })}
              onUpdate={(id, formData) => projectUpdateMutation.mutate({ id, formData })}
              pending={
                projectStatusMutation.isPending ||
                projectUpdateMutation.isPending ||
                projectDeleteMutation.isPending ||
                projectImageAddMutation.isPending ||
                projectImageRemoveMutation.isPending
              }
              projects={projects}
              terrains={terrains}
              terrainsLoading={terrainsQuery.isLoading}
            />
          ) : null}

          {activeSection === "noticias" ? (
            <NewsSection
              createError={newsCreateMutation.error}
              createPending={newsCreateMutation.isPending}
              createSuccess={newsCreateMutation.isSuccess}
              isLoading={newsQuery.isLoading}
              news={news}
              onCreate={(formData) => newsCreateMutation.mutate(formData)}
              onDelete={(id) => {
                if (confirmAction("Excluir esta noticia?")) {
                  newsDeleteMutation.mutate(id);
                }
              }}
              onUpdate={(post, formData) => newsUpdateMutation.mutate({ post, formData })}
              pending={newsCreateMutation.isPending || newsUpdateMutation.isPending || newsDeleteMutation.isPending}
            />
          ) : null}

          {activeSection === "simulacoes" ? (
            <SimulationsSection
              isLoading={simulationsQuery.isLoading}
              onDelete={(id) => simulationDeleteMutation.mutate(id)}
              onStatus={(id, status) => simulationStatusMutation.mutate({ id, status })}
              pending={simulationStatusMutation.isPending || simulationDeleteMutation.isPending}
              simulations={simulations}
            />
          ) : null}

          {activeSection === "pedidos" ? (
            <OrdersSection
              isLoading={ordersQuery.isLoading}
              onStatus={(id, status) => orderStatusMutation.mutate({ id, status })}
              orders={orders}
              pending={orderStatusMutation.isPending}
            />
          ) : null}

          {activeSection === "anuncios" ? (
            <AnnouncementsSection
              isLoading={overviewQuery.isLoading}
              onApprove={(id) => approveTerrainMutation.mutate(id)}
              onArchive={(id) => archiveTerrainMutation.mutate(id)}
              pending={approveTerrainMutation.isPending || archiveTerrainMutation.isPending}
              terrains={overview?.terrainQueue ?? []}
            />
          ) : null}

          {activeSection === "acessos" ? (
            <EventsSection
              events={events}
              isLoading={eventsQuery.isLoading}
              meta={eventsMeta}
              onPageChange={setEventsPage}
              onSearch={(search) => {
                setEventsPage(1);
                setEventsSearch(search);
              }}
              search={eventsSearch}
            />
          ) : null}

          {activeSection === "marca" ? (
            <section className={panelClass()}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase text-[var(--muted)]">Configurações</p>
                  <h3 className="mt-1 text-2xl font-semibold">Marca e identificação da empresa</h3>
                </div>
                {statusPill(settingsMutation.isPending ? "PENDING_REVIEW" : "ACTIVE")}
              </div>
              <form className="mt-5 grid gap-4 md:grid-cols-2" noValidate onSubmit={submitLogo}>
                <label>
                  <FieldLabel>Nome da marca</FieldLabel>
                  <input className={inputClass()} defaultValue={settingsQuery.data?.brandName ?? ""} name="brandName" required />
                </label>
                <label>
                  <FieldLabel>CRECI padrão da empresa</FieldLabel>
                  <input
                    className={inputClass()}
                    defaultValue={settingsQuery.data?.defaultCreci ?? ""}
                    name="defaultCreci"
                    placeholder="Ex.: CRECI 12345-J"
                  />
                </label>
                <label>
                  <FieldLabel>Logo clara</FieldLabel>
                  <input accept="image/*" className={inputClass()} name="logoLightFile" type="file" />
                </label>
                <label>
                  <FieldLabel>Logo escura</FieldLabel>
                  <input accept="image/*" className={inputClass()} name="logoDarkFile" type="file" />
                </label>
                <Button className="md:col-span-2" disabled={settingsMutation.isPending} type="submit" variant="secondary">
                  <Check size={18} />
                  Salvar configurações
                </Button>
              </form>
              {logoMessage ? <p className="mt-3 text-sm text-[var(--muted)]">{logoMessage}</p> : null}
            </section>
          ) : null}
        </main>
      </div>
    </section>
  );
}

function SmallStat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] p-3">
      <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
      <strong className="mt-2 block text-lg">{value ?? "..."}</strong>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-semibold uppercase text-[var(--muted)]">{children}</span>;
}

function DashboardSection({
  metrics,
  overview,
  isLoading
}: {
  metrics: Awaited<ReturnType<typeof getAdminMetrics>> | undefined;
  overview: Awaited<ReturnType<typeof getAdminOverview>> | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <MetricCard icon={Users} label="Clientes" value={String(metrics?.customers ?? "...")} />
        <MetricCard icon={ShieldAlert} label="Proprietarios" value={String(metrics?.terrainOwners ?? "...")} />
        <MetricCard icon={Building2} label="Arquitetos" value={String(metrics?.architects ?? "...")} />
        <MetricCard icon={Map} label="Terrenos" value={String(metrics?.terrains ?? "...")} />
        <MetricCard icon={ClipboardList} label="Projetos" value={String(metrics?.projects ?? "...")} />
        <MetricCard icon={CreditCard} label="Simulacoes" value={String(metrics?.simulations ?? "...")} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className={panelClass()}>
          <h3 className="text-xl font-semibold">Fila de anuncios</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Terrenos aguardando curadoria.</p>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {isLoading ? (
              <p className="py-5 text-sm text-[var(--muted)]">Carregando...</p>
            ) : overview?.terrainQueue.length ? (
              overview.terrainQueue.slice(0, 6).map((terrain) => (
                <div className="flex items-center justify-between gap-4 py-3" key={terrain.id}>
                  <div>
                    <strong>{terrain.title}</strong>
                    <p className="text-sm text-[var(--muted)]">{[terrain.city, terrain.state].filter(Boolean).join(" / ")}</p>
                  </div>
                  {statusPill(terrain.status)}
                </div>
              ))
            ) : (
              <p className="py-5 text-sm text-[var(--muted)]">Sem anuncios pendentes.</p>
            )}
          </div>
        </section>

        <section className={panelClass()}>
          <h3 className="text-xl font-semibold">Pedidos recentes</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">Ultimas movimentacoes comerciais.</p>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {isLoading ? (
              <p className="py-5 text-sm text-[var(--muted)]">Carregando...</p>
            ) : overview?.recentOrders.length ? (
              overview.recentOrders.slice(0, 6).map((order) => (
                <div className="flex items-center justify-between gap-4 py-3" key={order.id}>
                  <div>
                    <strong>{order.customer.name}</strong>
                    <p className="text-sm text-[var(--muted)]">{order.terrain?.title ?? order.project?.title ?? "Pedido sem item"}</p>
                  </div>
                  <strong>{money(order.total)}</strong>
                </div>
              ))
            ) : (
              <p className="py-5 text-sm text-[var(--muted)]">Sem pedidos recentes.</p>
            )}
          </div>
        </section>
      </div>

      <SimulationRequestsPanel />
    </div>
  );
}

function UsersSection({
  title,
  users,
  isLoading,
  statusMutationPending,
  updateMutationPending,
  deleteMutationPending,
  onBan,
  onReactivate,
  onUpdate,
  onDelete
}: {
  title: string;
  users: AdminUser[];
  isLoading: boolean;
  statusMutationPending: boolean;
  updateMutationPending: boolean;
  deleteMutationPending: boolean;
  onBan: (id: string) => void;
  onReactivate: (id: string) => void;
  onUpdate: (id: string, formData: FormData) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className={panelClass()}>
      <SectionHeader eyebrow="Pessoas" title={title} total={users.length} />
      <AdminTable columns={["Nome", "Contato", "Status", "Atividade", "Acoes"]} empty="Nenhum cadastro encontrado." isLoading={isLoading}>
        {users.map((adminUser) => (
          <tr className="align-top" key={adminUser.id}>
            <td className="px-4 py-4">
              <strong>{adminUser.name}</strong>
              <p className="mt-1 text-xs text-[var(--muted)]">{roleLabels[adminUser.role]}</p>
            </td>
            <td className="px-4 py-4">
              <p>{adminUser.email}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{adminUser.phone ?? "Sem telefone"}</p>
            </td>
            <td className="px-4 py-4">{statusPill(adminUser.status)}</td>
            <td className="px-4 py-4 text-xs text-[var(--muted)]">
              <p>Terrenos: {adminUser._count?.ownedTerrains ?? 0}</p>
              <p>Simulacoes: {adminUser._count?.simulations ?? 0}</p>
              <p>Pedidos: {adminUser._count?.orders ?? 0}</p>
            </td>
            <td className="px-4 py-4">
              <div className="flex min-w-[280px] flex-wrap gap-2">
                <ActionButton disabled={statusMutationPending} onClick={() => onBan(adminUser.id)} tone="danger">
                  <Ban size={14} />
                  Banir
                </ActionButton>
                <ActionButton disabled={statusMutationPending} onClick={() => onReactivate(adminUser.id)} tone="success">
                  <Check size={14} />
                  Ativar
                </ActionButton>
                <ActionButton
                  disabled={deleteMutationPending}
                  onClick={() => {
                    if (confirmAction("Excluir este cadastro? A acao remove da listagem, mas preserva historico interno.")) {
                      onDelete(adminUser.id);
                    }
                  }}
                  tone="danger"
                >
                  <Trash2 size={14} />
                  Excluir
                </ActionButton>
              </div>
              <div className="mt-3">
                <EditPanel label="Editar">
                  <UserEditForm adminUser={adminUser} disabled={updateMutationPending} onSubmit={onUpdate} />
                </EditPanel>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}

function UserEditForm({
  adminUser,
  disabled,
  onSubmit
}: {
  adminUser: AdminUser;
  disabled: boolean;
  onSubmit: (id: string, formData: FormData) => void;
}) {
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(adminUser.id, new FormData(event.currentTarget));
      }}
    >
      <input className={inputClass()} defaultValue={adminUser.name} name="name" placeholder="Nome" required />
      <input className={inputClass()} defaultValue={adminUser.email} name="email" placeholder="E-mail" required />
      <input className={inputClass()} defaultValue={adminUser.phone ?? ""} name="phone" placeholder="Telefone" />
      <input className={inputClass()} defaultValue={adminUser.document ?? ""} name="document" placeholder="Documento" />
      <select className={inputClass()} defaultValue={adminUser.role} name="role">
        {(["CUSTOMER", "TERRAIN_OWNER", "ARCHITECT", "ADMIN"] as UserRole[]).map((role) => (
          <option key={role} value={role}>
            {roleLabels[role]}
          </option>
        ))}
      </select>
      <select className={inputClass()} defaultValue={adminUser.status} name="status">
        {userStatuses.map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>
      <Button className="md:col-span-2" disabled={disabled} type="submit" variant="secondary">
        <Pencil size={16} />
        Salvar alteracoes
      </Button>
    </form>
  );
}

function ArchitectsSection({
  architects,
  createError,
  createPending,
  createSuccess,
  isLoading,
  pending,
  onApprove,
  onReject,
  onBan,
  onCreate,
  onDelete,
  onUpdate
}: {
  architects: ArchitectProfile[];
  createError: unknown;
  createPending: boolean;
  createSuccess: boolean;
  isLoading: boolean;
  pending: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onBan: (architectId: string, userId: string) => void;
  onCreate: (formData: FormData) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, formData: FormData) => void;
}) {
  return (
    <section className={panelClass()}>
      <SectionHeader eyebrow="Curadoria" title="Arquitetos" total={architects.length} />
      <ArchitectCreateForm disabled={createPending} onSubmit={onCreate} />
      {createSuccess ? (
        <p className="mb-4 rounded-[8px] bg-emerald-500/10 p-3 text-sm text-emerald-700">Arquiteto cadastrado com sucesso.</p>
      ) : null}
      {createError ? (
        <p className="mb-4 rounded-[8px] bg-red-500/10 p-3 text-sm text-red-600">Nao foi possivel cadastrar: {errorMessage(createError)}</p>
      ) : null}
      <AdminTable columns={["Arquiteto", "Contato", "Status", "Projetos", "Acoes"]} empty="Nenhum arquiteto cadastrado." isLoading={isLoading}>
        {architects.map((architect) => (
          <tr className="align-top" key={architect.id}>
            <td className="px-4 py-4">
              <strong>{architect.companyName ?? architect.user.name}</strong>
              <p className="mt-1 text-xs text-[var(--muted)]">CAU: {architect.cauNumber ?? "Nao informado"}</p>
            </td>
            <td className="px-4 py-4">
              <p>{architect.user.email}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{architect.user.phone ?? "Sem telefone"}</p>
            </td>
            <td className="px-4 py-4">{statusPill(architect.status)}</td>
            <td className="px-4 py-4">{architect._count?.projects ?? 0}</td>
            <td className="px-4 py-4">
              <div className="flex min-w-[360px] flex-wrap gap-2">
                <ActionButton disabled={pending} onClick={() => onApprove(architect.id)} tone="success">
                  <Check size={14} />
                  Aprovar
                </ActionButton>
                <ActionButton disabled={pending} onClick={() => onReject(architect.id)} tone="danger">
                  <X size={14} />
                  Recusar
                </ActionButton>
                <ActionButton disabled={pending} onClick={() => onBan(architect.id, architect.user.id)} tone="danger">
                  <Ban size={14} />
                  Banir
                </ActionButton>
                <ActionButton
                  disabled={pending}
                  onClick={() => {
                    if (confirmAction("Excluir este perfil de arquiteto?")) {
                      onDelete(architect.id);
                    }
                  }}
                  tone="danger"
                >
                  <Trash2 size={14} />
                  Excluir
                </ActionButton>
              </div>
              <div className="mt-3 grid gap-2">
                <EditPanel label="Ver informacoes">
                  <ArchitectDetails architect={architect} />
                </EditPanel>
                <EditPanel label="Editar arquiteto">
                  <ArchitectEditForm architect={architect} disabled={pending} onSubmit={onUpdate} />
                </EditPanel>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}

function ArchitectCreateForm({
  disabled,
  onSubmit
}: {
  disabled: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <form
      className="mb-5 rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted)]">Novo acesso</p>
          <h4 className="mt-1 text-lg font-semibold">Cadastrar arquiteto</h4>
        </div>
        <span className="text-xs text-[var(--muted)]">Senha minima de 8 caracteres.</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input className={inputClass()} name="name" placeholder="Nome do responsavel" required />
        <input className={inputClass()} name="email" placeholder="E-mail de acesso" required type="email" />
        <input className={inputClass()} minLength={8} name="password" placeholder="Senha inicial" required type="password" />
        <input className={inputClass()} name="phone" placeholder="Telefone" />
        <input className={inputClass()} name="companyName" placeholder="Nome do escritorio" />
        <input className={inputClass()} name="cauNumber" placeholder="CAU" />
        <input className={inputClass()} name="website" placeholder="Site ou portfolio" />
        <select className={inputClass()} defaultValue="APPROVED" name="status">
          {architectStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <textarea className={`${textareaClass()} xl:col-span-4`} name="bio" placeholder="Resumo do arquiteto ou observacao interna" />
      </div>
      <Button className="mt-4 w-full md:w-auto" disabled={disabled} type="submit" variant="secondary">
        <UserPlus size={16} />
        {disabled ? "Cadastrando..." : "Cadastrar arquiteto"}
      </Button>
    </form>
  );
}

function ArchitectDetails({ architect }: { architect: ArchitectProfile }) {
  return (
    <div className="grid gap-3 text-sm md:grid-cols-2">
      <DetailItem label="Responsavel" value={architect.user.name} />
      <DetailItem label="E-mail" value={architect.user.email} />
      <DetailItem label="Telefone" value={architect.user.phone ?? "Nao informado"} />
      <DetailItem label="Status do acesso" value={statusLabel(architect.user.status)} />
      <DetailItem label="Escritorio" value={architect.companyName ?? "Nao informado"} />
      <DetailItem label="CAU" value={architect.cauNumber ?? "Nao informado"} />
      <DetailItem label="Site ou portfolio" value={architect.website ?? "Nao informado"} />
      <DetailItem label="Projetos cadastrados" value={String(architect._count?.projects ?? 0)} />
      <DetailItem label="Data do cadastro" value={dateTime(architect.createdAt ?? architect.user.createdAt)} />
      <DetailItem label="Status do perfil" value={statusLabel(architect.status)} />
      <div className="md:col-span-2">
        <DetailItem label="Biografia" value={architect.bio ?? "Nao informada"} />
      </div>
      <div className="md:col-span-2">
        <DetailItem label="Motivo da recusa" value={architect.rejectionReason ?? "Sem motivo registrado"} />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-3">
      <p className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 break-words font-medium">{value || "-"}</p>
    </div>
  );
}

function ArchitectEditForm({
  architect,
  disabled,
  onSubmit
}: {
  architect: ArchitectProfile;
  disabled: boolean;
  onSubmit: (id: string, formData: FormData) => void;
}) {
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(architect.id, new FormData(event.currentTarget));
      }}
    >
      <input className={inputClass()} defaultValue={architect.companyName ?? ""} name="companyName" placeholder="Nome do escritorio" />
      <input className={inputClass()} defaultValue={architect.cauNumber ?? ""} name="cauNumber" placeholder="CAU" />
      <input className={inputClass()} defaultValue={architect.website ?? ""} name="website" placeholder="Site ou portfolio" />
      <select className={inputClass()} defaultValue={architect.status} name="status">
        {architectStatuses.map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>
      <textarea className={`${textareaClass()} md:col-span-2`} defaultValue={architect.bio ?? ""} name="bio" placeholder="Bio" />
      <input className={`${inputClass()} md:col-span-2`} defaultValue={architect.rejectionReason ?? ""} name="rejectionReason" placeholder="Motivo da recusa" />
      <Button className="md:col-span-2" disabled={disabled} type="submit" variant="secondary">
        <Pencil size={16} />
        Salvar arquiteto
      </Button>
    </form>
  );
}

function TerrainsSection({
  terrains,
  isLoading,
  pending,
  createPending,
  createSuccess,
  createError,
  imagePending,
  imageError,
  onApprove,
  onArchive,
  onStatus,
  onUpdate,
  onDelete,
  onCreate,
  onAddImage,
  onRemoveImage
}: {
  terrains: Terrain[];
  isLoading: boolean;
  pending: boolean;
  createPending: boolean;
  createSuccess: boolean;
  createError: unknown;
  imagePending: boolean;
  imageError: unknown;
  onApprove: (id: string) => void;
  onArchive: (id: string) => void;
  onStatus: (id: string, status: TerrainStatus) => void;
  onUpdate: (id: string, formData: FormData, metadata?: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onCreate: (formData: FormData) => void;
  onAddImage: (id: string, formData: FormData) => void;
  onRemoveImage: (id: string) => void;
}) {
  return (
    <section className={panelClass()}>
      <SectionHeader eyebrow="Catalogo" title="Terrenos" total={terrains.length} />
      <TerrainCreateForm disabled={createPending} onSubmit={onCreate} />
      {createSuccess ? (
        <p className="mb-4 rounded-[8px] bg-emerald-500/10 p-3 text-sm text-emerald-700">Terreno cadastrado e publicado com sucesso.</p>
      ) : null}
      {createError ? (
        <p className="mb-4 rounded-[8px] bg-red-500/10 p-3 text-sm text-red-600">Nao foi possivel cadastrar o terreno: {errorMessage(createError)}</p>
      ) : null}
      {imageError ? (
        <p className="mb-4 rounded-[8px] bg-red-500/10 p-3 text-sm text-red-600">Nao foi possivel alterar a imagem: {errorMessage(imageError)}</p>
      ) : null}
      <AdminTable columns={["Terreno", "Local", "Valores", "Status", "Acoes"]} empty="Nenhum terreno cadastrado." isLoading={isLoading}>
        {terrains.map((terrain) => {
          const details = getTerrainPropertyDetails(terrain.metadata);

          return (
          <tr className="align-top" key={terrain.id}>
            <td className="px-4 py-4">
              <strong>{terrain.title}</strong>
              <p className="mt-1 text-xs text-[var(--muted)]">{terrain.owner?.name ?? "Sem proprietario"}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {[details.propertyType, details.destination, details.situation].filter(Boolean).join(" / ") || "Tipo nao informado"}
              </p>
            </td>
            <td className="px-4 py-4">
              <p>{[terrain.neighborhood, terrain.city, terrain.state].filter(Boolean).join(", ")}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{terrain.address ?? "Endereco nao informado"}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {terrainDevelopmentLabel(getTerrainDevelopmentType(terrain.metadata))}
              </p>
            </td>
            <td className="px-4 py-4">
              <p>{money(terrain.price)}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{area(terrain.areaM2)}</p>
              {details.iptuValue || details.condominiumValue ? (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {details.iptuValue ? `IPTU ${money(details.iptuValue)}` : ""}
                  {details.iptuValue && details.condominiumValue ? " / " : ""}
                  {details.condominiumValue ? `Condominio ${money(details.condominiumValue)}` : ""}
                </p>
              ) : null}
            </td>
            <td className="px-4 py-4">{statusPill(terrain.status)}</td>
            <td className="px-4 py-4">
              <div className="flex min-w-[360px] flex-wrap gap-2">
                <ActionButton disabled={pending} onClick={() => onApprove(terrain.id)} tone="success">
                  Publicar
                </ActionButton>
                <ActionButton disabled={pending} onClick={() => onStatus(terrain.id, "RESERVED")}>
                  Reservar
                </ActionButton>
                <ActionButton disabled={pending} onClick={() => onArchive(terrain.id)} tone="danger">
                  Arquivar
                </ActionButton>
                <ActionButton
                  disabled={pending}
                  onClick={() => {
                    if (confirmAction("Excluir este terreno da listagem?")) {
                      onDelete(terrain.id);
                    }
                  }}
                  tone="danger"
                >
                  <Trash2 size={14} />
                  Excluir
                </ActionButton>
              </div>
              <div className="mt-3">
                <EditPanel label="Editar terreno">
                  <TerrainEditForm disabled={pending} onSubmit={onUpdate} terrain={terrain} />
                  <AdminImageManager
                    disabled={imagePending}
                    emptyText="Nenhuma imagem cadastrada para este terreno."
                    images={terrain.images}
                    onAdd={(formData) => onAddImage(terrain.id, formData)}
                    onRemove={onRemoveImage}
                    title="Imagens do terreno"
                  />
                </EditPanel>
              </div>
            </td>
          </tr>
          );
        })}
      </AdminTable>
    </section>
  );
}

function TerrainCreateForm({
  disabled,
  onSubmit
}: {
  disabled: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <form
      className="mb-5 rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted)]">Novo terreno</p>
          <h4 className="mt-1 text-lg font-semibold">Cadastrar terreno pelo admin</h4>
        </div>
        <span className="text-xs text-[var(--muted)]">Terrenos criados pelo admin entram publicados.</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input className={inputClass()} name="title" placeholder="Titulo do terreno" required />
        <CurrencyInput name="price" placeholder="Valor do terreno" required />
        <input className={inputClass()} min={1} name="areaM2" placeholder="Area total em m2" required type="number" />
        <input className={inputClass()} name="city" placeholder="Cidade" required />
        <input className={inputClass()} name="state" placeholder="Estado" required />
        <input className={inputClass()} name="neighborhood" placeholder="Bairro" />
        <input className={`${inputClass()} xl:col-span-2`} name="address" placeholder="Rua / avenida / numero" required />
        <input className={inputClass()} name="zipCode" placeholder="CEP" />
        <input className={inputClass()} min={0} name="frontageM" placeholder="Frente em metros" type="number" />
        <input className={inputClass()} min={0} name="depthM" placeholder="Fundo em metros" type="number" />
        <input className={inputClass()} name="zoning" placeholder="Zoneamento" />
        <select className={selectClass()} defaultValue="Terreno" name="propertyType" required>
          <option value="Area">Area</option>
          <option value="Chacara">Chacara</option>
          <option value="Lote">Lote</option>
          <option value="Lote em condominio">Lote em condominio</option>
          <option value="Terreno">Terreno</option>
          <option value="Terreno em condominio">Terreno em condominio</option>
        </select>
        <select className={selectClass()} defaultValue="Residencial" name="destination" required>
          <option value="Residencial">Residencial</option>
          <option value="Comercial">Comercial</option>
        </select>
        <select className={selectClass()} defaultValue="Liberado para construcao" name="situation" required>
          <option value="Breve lancamento">Breve lancamento</option>
          <option value="Lancamento">Lancamento</option>
          <option value="Liberado para construcao">Liberado para construcao</option>
        </select>
        <select className={selectClass()} defaultValue="OPEN" name="developmentType" required>
          <option value="OPEN">Local aberto</option>
          <option value="CLOSED">Condomínio ou loteamento fechado</option>
        </select>
        <CurrencyInput name="iptuValue" placeholder="IPTU" />
        <CurrencyInput name="condominiumValue" placeholder="Condominio" />
        <textarea className={`${textareaClass()} xl:col-span-4`} name="description" placeholder="Descricao do terreno" required />
      </div>

      <div className="mt-4 grid gap-3 rounded-[8px] border border-[var(--line)] p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-4">
          <p className="text-sm font-semibold">Imagem inicial</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Opcional. Se marcar como capa, ela sera a foto principal do terreno.</p>
        </div>
        <input accept="image/*" className={inputClass()} name="imageFile" type="file" />
        <input className={inputClass()} name="imageUrl" placeholder="Ou URL da imagem" type="url" />
        <input className={inputClass()} name="altText" placeholder="Descricao da imagem" />
        <label className="flex items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 py-2 text-sm font-semibold">
          <input className="h-4 w-4 accent-[var(--accent)]" defaultChecked name="isCover" type="checkbox" />
          Usar como capa
        </label>
      </div>

      <Button className="mt-4 w-full md:w-auto" disabled={disabled} type="submit" variant="secondary">
        <Map size={16} />
        {disabled ? "Cadastrando..." : "Cadastrar terreno"}
      </Button>
    </form>
  );
}

function TerrainEditForm({
  terrain,
  disabled,
  onSubmit
}: {
  terrain: Terrain;
  disabled: boolean;
  onSubmit: (id: string, formData: FormData, metadata?: Record<string, unknown>) => void;
}) {
  const developmentType = getTerrainDevelopmentType(terrain.metadata);
  const details = getTerrainPropertyDetails(terrain.metadata);

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(terrain.id, new FormData(event.currentTarget), terrain.metadata);
      }}
    >
      <input className={inputClass()} defaultValue={terrain.title} name="title" placeholder="Titulo" required />
      <CurrencyInput defaultValue={String(terrain.price ?? "")} name="price" placeholder="Valor" />
      <input className={inputClass()} defaultValue={String(terrain.areaM2)} name="areaM2" placeholder="Area total" type="number" />
      <input className={inputClass()} defaultValue={terrain.city} name="city" placeholder="Cidade" required />
      <input className={inputClass()} defaultValue={terrain.state} name="state" placeholder="Estado" required />
      <input className={inputClass()} defaultValue={terrain.neighborhood ?? ""} name="neighborhood" placeholder="Bairro" />
      <input className={inputClass()} defaultValue={terrain.address ?? ""} name="address" placeholder="Rua / avenida" required />
      <input className={inputClass()} defaultValue={terrain.zipCode ?? ""} name="zipCode" placeholder="CEP" />
      <input className={inputClass()} defaultValue={String(terrain.frontageM ?? "")} name="frontageM" placeholder="Frente" type="number" />
      <input className={inputClass()} defaultValue={String(terrain.depthM ?? "")} name="depthM" placeholder="Fundo" type="number" />
      <input className={inputClass()} defaultValue={terrain.zoning ?? ""} name="zoning" placeholder="Zoneamento" />
      <select className={selectClass()} defaultValue={details.propertyType ?? "Terreno"} name="propertyType">
        <option value="Area">Area</option>
        <option value="Chacara">Chacara</option>
        <option value="Lote">Lote</option>
        <option value="Lote em condominio">Lote em condominio</option>
        <option value="Terreno">Terreno</option>
        <option value="Terreno em condominio">Terreno em condominio</option>
      </select>
      <select className={selectClass()} defaultValue={details.destination ?? "Residencial"} name="destination">
        <option value="Residencial">Residencial</option>
        <option value="Comercial">Comercial</option>
      </select>
      <select className={selectClass()} defaultValue={details.situation ?? "Liberado para construcao"} name="situation">
        <option value="Breve lancamento">Breve lancamento</option>
        <option value="Lancamento">Lancamento</option>
        <option value="Liberado para construcao">Liberado para construcao</option>
      </select>
      <select className={selectClass()} defaultValue={developmentType ?? "OPEN"} name="developmentType">
        <option value="OPEN">Local aberto</option>
        <option value="CLOSED">Condomínio ou loteamento fechado</option>
      </select>
      <CurrencyInput defaultValue={details.iptuValue ? String(details.iptuValue) : ""} name="iptuValue" placeholder="IPTU" />
      <CurrencyInput defaultValue={details.condominiumValue ? String(details.condominiumValue) : ""} name="condominiumValue" placeholder="Condominio" />
      <textarea className={`${textareaClass()} md:col-span-2`} defaultValue={terrain.description} name="description" placeholder="Descricao" />
      <Button className="md:col-span-2" disabled={disabled} type="submit" variant="secondary">
        <Pencil size={16} />
        Salvar terreno
      </Button>
    </form>
  );
}

function ProjectsSection({
  projects,
  terrains,
  terrainsLoading,
  isLoading,
  pending,
  imagePending,
  imageError,
  onStatus,
  onUpdate,
  onDelete,
  onAddImage,
  onRemoveImage
}: {
  projects: Project[];
  terrains: Terrain[];
  terrainsLoading: boolean;
  isLoading: boolean;
  pending: boolean;
  imagePending: boolean;
  imageError: unknown;
  onStatus: (id: string, status: ProjectStatus) => void;
  onUpdate: (id: string, formData: FormData) => void;
  onDelete: (id: string) => void;
  onAddImage: (id: string, formData: FormData) => void;
  onRemoveImage: (id: string) => void;
}) {
  return (
    <section className={panelClass()}>
      <SectionHeader eyebrow="Projetos" title="Projetos arquitetonicos" total={projects.length} />
      {imageError ? (
        <p className="mb-4 rounded-[8px] bg-red-500/10 p-3 text-sm text-red-600">Nao foi possivel alterar a imagem: {errorMessage(imageError)}</p>
      ) : null}
      <AdminTable columns={["Projeto", "Arquiteto", "Detalhes", "Status", "Acoes"]} empty="Nenhum projeto cadastrado." isLoading={isLoading}>
        {projects.map((project) => (
          <tr className="align-top" key={project.id}>
            <td className="px-4 py-4">
              <strong>{project.title}</strong>
              <p className="mt-1 text-xs text-[var(--muted)]">{project.style ?? "Sem estilo"}</p>
            </td>
            <td className="px-4 py-4">{project.architect?.companyName ?? project.architect?.user?.name ?? "Sem arquiteto"}</td>
            <td className="px-4 py-4">
              <p>{area(project.areaM2)}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {project.bedrooms} quartos, {project.bathrooms} banheiros
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">Projeto {money(project.price)}</p>
            </td>
            <td className="px-4 py-4">{statusPill(project.status)}</td>
            <td className="px-4 py-4">
              <div className="flex min-w-[340px] flex-wrap gap-2">
                <ActionButton disabled={pending} onClick={() => onStatus(project.id, "PUBLISHED")} tone="success">
                  Publicar
                </ActionButton>
                <ActionButton disabled={pending} onClick={() => onStatus(project.id, "PENDING_REVIEW")}>
                  Revisar
                </ActionButton>
                <ActionButton disabled={pending} onClick={() => onStatus(project.id, "ARCHIVED")} tone="danger">
                  Arquivar
                </ActionButton>
                <ActionButton
                  disabled={pending}
                  onClick={() => {
                    if (confirmAction("Excluir este projeto da listagem?")) {
                      onDelete(project.id);
                    }
                  }}
                  tone="danger"
                >
                  <Trash2 size={14} />
                  Excluir
                </ActionButton>
              </div>
              <div className="mt-3">
                <EditPanel label="Editar projeto">
                  <ProjectEditForm disabled={pending} onSubmit={onUpdate} project={project} />
                  <AdminImageManager
                    disabled={imagePending}
                    emptyText="Nenhuma imagem cadastrada para este projeto."
                    images={project.images}
                    onAdd={(formData) => onAddImage(project.id, formData)}
                    onRemove={onRemoveImage}
                    title="Imagens do projeto"
                  />
                </EditPanel>
                <EditPanel label="Adequar projetos aos terrenos">
                  {terrainsLoading ? (
                    <div className="rounded-[8px] border border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                      Carregando terrenos para adequacao...
                    </div>
                  ) : (
                    <ProjectTerrainFitForm key={project.id} project={project} terrains={terrains} />
                  )}
                </EditPanel>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}

function ProjectEditForm({
  project,
  disabled,
  onSubmit
}: {
  project: Project;
  disabled: boolean;
  onSubmit: (id: string, formData: FormData) => void;
}) {
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(project.id, new FormData(event.currentTarget));
      }}
    >
      <input className={inputClass()} defaultValue={project.title} name="title" placeholder="Titulo" required />
      <input className={inputClass()} defaultValue={project.style ?? ""} name="style" placeholder="Estilo" />
      <input className={inputClass()} defaultValue={String(project.bedrooms)} name="bedrooms" placeholder="Quartos" type="number" />
      <input className={inputClass()} defaultValue={String(project.bathrooms)} name="bathrooms" placeholder="Banheiros" type="number" />
      <input className={inputClass()} defaultValue={String(project.suites ?? "")} name="suites" placeholder="Suites" type="number" />
      <input className={inputClass()} defaultValue={String(project.parkingSpaces ?? "")} name="parkingSpaces" placeholder="Vagas" type="number" />
      <input className={inputClass()} defaultValue={String(project.floors ?? "")} name="floors" placeholder="Pavimentos" type="number" />
      <input className={inputClass()} defaultValue={String(project.areaM2)} name="areaM2" placeholder="Area" type="number" />
      <CurrencyInput defaultValue={String(project.price ?? "")} name="price" placeholder="Preco do projeto" />
      <CurrencyInput defaultValue={String(project.estimatedBuildCost ?? "")} name="estimatedBuildCost" placeholder="Custo da obra" />
      <input className={`${inputClass()} md:col-span-2`} defaultValue={project.architect?.id ?? ""} name="architectId" placeholder="ID do arquiteto" />
      <textarea className={`${textareaClass()} md:col-span-2`} defaultValue={project.description} name="description" placeholder="Descricao" />
      <Button className="md:col-span-2" disabled={disabled} type="submit" variant="secondary">
        <Pencil size={16} />
        Salvar projeto
      </Button>
    </form>
  );
}

function AdminImageManager({
  title,
  emptyText,
  images,
  disabled,
  onAdd,
  onRemove
}: {
  title: string;
  emptyText: string;
  images?: AssetImage[];
  disabled: boolean;
  onAdd: (formData: FormData) => void;
  onRemove: (id: string) => void;
}) {
  const sortedImages = [...(images ?? [])].sort((left, right) => {
    if (left.isCover !== right.isCover) {
      return left.isCover ? -1 : 1;
    }

    return (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
  });

  return (
    <div className="mt-5 border-t border-[var(--line)] pt-5">
      <div className="mb-3 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted)]">Midia</p>
          <h4 className="text-lg font-semibold">{title}</h4>
        </div>
        <span className="text-xs text-[var(--muted)]">Para trocar a capa, envie uma nova imagem marcada como capa.</span>
      </div>

      {sortedImages.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedImages.map((image, index) => (
            <article className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)]" key={image.id ?? `${image.url}-${index}`}>
              <div className="aspect-[16/10] bg-black/5">
                <PrivacyImage alt={image.altText ?? `Imagem ${index + 1}`} className="h-full w-full object-cover" src={image.url} />
              </div>
              <div className="grid gap-3 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <strong>{image.isCover ? "Capa principal" : `Imagem ${index + 1}`}</strong>
                  <span className="rounded-[8px] border border-[var(--line)] px-2 py-1 text-[var(--muted)]">Ordem {image.sortOrder ?? 0}</span>
                </div>
                <p className="line-clamp-2 text-[var(--muted)]">{image.altText ?? "Sem descricao"}</p>
                <ActionButton
                  disabled={disabled || !image.id}
                  onClick={() => {
                    if (image.id && confirmAction("Remover esta imagem?")) {
                      onRemove(image.id);
                    }
                  }}
                  tone="danger"
                >
                  <Trash2 size={14} />
                  Remover imagem
                </ActionButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">{emptyText}</div>
      )}

      <form
        className="mt-4 grid gap-3 rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-4 md:grid-cols-2"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          onAdd(new FormData(form));
          form.reset();
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          <span>Arquivo da imagem</span>
          <input accept="image/*" className={inputClass()} name="imageFile" type="file" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>Ou URL da imagem</span>
          <input className={inputClass()} name="imageUrl" placeholder="https://..." type="url" />
        </label>
        <input className={inputClass()} name="altText" placeholder="Descricao da imagem" />
        <input className={inputClass()} defaultValue={String(sortedImages.length + 1)} min={0} name="sortOrder" placeholder="Ordem" type="number" />
        <label className="flex items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 py-2 text-sm font-semibold">
          <input className="h-4 w-4 accent-[var(--accent)]" name="isCover" type="checkbox" />
          Usar como capa principal
        </label>
        <Button className="md:justify-self-start" disabled={disabled} type="submit" variant="secondary">
          <ImageIcon size={16} />
          Adicionar / trocar imagem
        </Button>
      </form>
    </div>
  );
}

function NewsSection({
  news,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  pending,
  createPending,
  createSuccess,
  createError
}: {
  news: NewsPost[];
  isLoading: boolean;
  onCreate: (formData: FormData) => void;
  onUpdate: (post: NewsPost, formData: FormData) => void;
  onDelete: (id: string) => void;
  pending: boolean;
  createPending: boolean;
  createSuccess: boolean;
  createError: unknown;
}) {
  return (
    <section className={panelClass()}>
      <SectionHeader eyebrow="Conteudo" title="Noticias da construcao" total={news.length} />

      <form
        className="mb-6 grid gap-4 border-b border-[var(--line)] pb-6 md:grid-cols-2"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(new FormData(event.currentTarget));
        }}
      >
        <div className="md:col-span-2">
          <p className="text-sm font-semibold uppercase text-[var(--accent)]">Nova noticia</p>
          <h4 className="mt-1 text-xl font-semibold">Cadastrar postagem</h4>
        </div>
        <label>
          <FieldLabel>Titulo</FieldLabel>
          <input className={inputClass()} maxLength={180} minLength={3} name="title" required />
        </label>
        <label>
          <FieldLabel>Autor</FieldLabel>
          <input className={inputClass()} maxLength={120} name="author" placeholder="Equipe Ce Constroi" />
        </label>
        <label className="md:col-span-2">
          <FieldLabel>Resumo</FieldLabel>
          <textarea className={textareaClass()} maxLength={420} minLength={3} name="excerpt" required />
        </label>
        <label className="md:col-span-2">
          <FieldLabel>Conteudo completo</FieldLabel>
          <textarea className={`${textareaClass()} min-h-64`} minLength={3} name="content" required />
        </label>
        <label>
          <FieldLabel>Imagem de capa</FieldLabel>
          <input accept="image/*" className={inputClass()} name="imageFile" type="file" />
        </label>
        <label>
          <FieldLabel>Ou URL da imagem</FieldLabel>
          <input className={inputClass()} name="imageUrl" placeholder="https://..." />
        </label>
        <label>
          <FieldLabel>Status</FieldLabel>
          <select className={inputClass()} defaultValue="DRAFT" name="status">
            {newsStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button className="w-full" disabled={createPending} type="submit" variant="secondary">
            <Newspaper size={18} />
            {createPending ? "Salvando..." : "Cadastrar noticia"}
          </Button>
        </div>
        {createSuccess ? (
          <p className="md:col-span-2 rounded-[8px] bg-emerald-500/10 p-3 text-sm text-emerald-700">
            Noticia cadastrada com sucesso.
          </p>
        ) : null}
        {createError ? (
          <p className="md:col-span-2 rounded-[8px] bg-red-500/10 p-3 text-sm text-red-700">
            Nao foi possivel cadastrar: {errorMessage(createError)}
          </p>
        ) : null}
      </form>

      <AdminTable columns={["Capa", "Noticia", "Status", "Publicacao", "Acoes"]} empty="Nenhuma noticia cadastrada." isLoading={isLoading}>
        {news.map((post) => (
          <tr className="align-top" key={post.id}>
            <td className="px-4 py-4">
              <div className="h-16 w-24 overflow-hidden rounded-[8px] bg-black/5 dark:bg-white/10">
                {post.imageUrl ? (
                  <PrivacyImage alt={post.title} className="h-full w-full object-cover" src={post.imageUrl} />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--accent)]">
                    <Newspaper size={24} />
                  </div>
                )}
              </div>
            </td>
            <td className="max-w-md px-4 py-4">
              <strong>{post.title}</strong>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{post.excerpt}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{post.author || "Sem autor informado"}</p>
            </td>
            <td className="px-4 py-4">{statusPill(post.status)}</td>
            <td className="px-4 py-4">{dateTime(post.publishedAt ?? post.createdAt)}</td>
            <td className="min-w-72 px-4 py-4">
              <div className="grid gap-2">
                {post.status === "PUBLISHED" ? (
                  <Link
                    className="focus-ring inline-flex h-9 items-center justify-center rounded-[8px] border border-[var(--line)] px-3 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10"
                    href={`/noticias/${post.slug}` as Route}
                    target="_blank"
                  >
                    Ver noticia
                  </Link>
                ) : null}
                <EditPanel label="Editar noticia">
                  <form
                    className="grid gap-3"
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      onUpdate(post, new FormData(event.currentTarget));
                    }}
                  >
                    <input className={inputClass()} defaultValue={post.title} maxLength={180} minLength={3} name="title" required />
                    <input className={inputClass()} defaultValue={post.author ?? ""} maxLength={120} name="author" placeholder="Autor" />
                    <textarea className={textareaClass()} defaultValue={post.excerpt} maxLength={420} minLength={3} name="excerpt" required />
                    <textarea className={`${textareaClass()} min-h-56`} defaultValue={post.content} minLength={3} name="content" required />
                    <input accept="image/*" className={inputClass()} name="imageFile" type="file" />
                    <input className={inputClass()} defaultValue={post.imageUrl ?? ""} name="imageUrl" placeholder="URL da imagem" />
                    <select className={inputClass()} defaultValue={post.status} name="status">
                      {newsStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                    <Button disabled={pending} type="submit" variant="secondary">
                      <Check size={16} />
                      Salvar noticia
                    </Button>
                  </form>
                </EditPanel>
                <ActionButton disabled={pending} onClick={() => onDelete(post.id)} tone="danger">
                  <Trash2 size={15} />
                  Excluir
                </ActionButton>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}

function SimulationsSection({
  simulations,
  isLoading,
  pending,
  onStatus,
  onDelete
}: {
  simulations: AdminSimulation[];
  isLoading: boolean;
  pending: boolean;
  onStatus: (id: string, status: SimulationStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className={panelClass()}>
      <SectionHeader eyebrow="Financeiro" title="Simulacoes" total={simulations.length} />
      <AdminTable columns={["Cliente", "Pacote", "Valores", "Status", "Acoes"]} empty="Nenhuma simulacao salva." isLoading={isLoading}>
        {simulations.map((simulation) => {
          const frontendResult = simulationFrontendResult(simulation);
          const adjustmentMessage =
            typeof frontendResult.adjustmentMessage === "string" ? frontendResult.adjustmentMessage : null;

          return (
          <tr className="align-top" key={simulation.id}>
            <td className="px-4 py-4">
              <strong>{simulationCustomerName(simulation)}</strong>
              <p className="mt-1 text-xs text-[var(--muted)]">{simulationCustomerEmail(simulation)}</p>
              {simulation.customer?.name && simulation.customer.name !== simulationCustomerName(simulation) ? (
                <p className="mt-1 text-xs text-[var(--muted)]">Conta: {simulation.customer.name}</p>
              ) : null}
            </td>
            <td className="px-4 py-4">
              <p>{simulation.terrain?.title ?? "Terreno manual"}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{simulation.project?.title ?? "Sem projeto"}</p>
              {adjustmentMessage ? <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--muted)]">{adjustmentMessage}</p> : null}
            </td>
            <td className="px-4 py-4">
              <p>Pacote {money(simulationDisplayNumber(simulation, "desiredPackageValue", simulation.totalAmount))}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Parcela {money(simulationDisplayNumber(simulation, "estimatedInstallment", simulation.monthlyPayment))}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Entrada informada {money(simulationDisplayNumber(simulation, "availableEntry", simulation.downPayment))}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Entrada necessaria {money(simulationDisplayNumber(simulation, "minimumRequiredEntry", simulation.downPayment))}
              </p>
            </td>
            <td className="px-4 py-4">{statusPill(simulation.status)}</td>
            <td className="px-4 py-4">
              <div className="flex min-w-[310px] flex-wrap gap-2">
                {simulationStatuses.map((status) => (
                  <ActionButton disabled={pending} key={status} onClick={() => onStatus(simulation.id, status)}>
                    {statusLabel(status)}
                  </ActionButton>
                ))}
                <ActionButton
                  disabled={pending}
                  onClick={() => {
                    if (confirmAction("Excluir esta simulacao da listagem?")) {
                      onDelete(simulation.id);
                    }
                  }}
                  tone="danger"
                >
                  <Trash2 size={14} />
                  Excluir
                </ActionButton>
              </div>
            </td>
          </tr>
          );
        })}
      </AdminTable>
    </section>
  );
}

function OrdersSection({
  orders,
  isLoading,
  pending,
  onStatus
}: {
  orders: AdminOrder[];
  isLoading: boolean;
  pending: boolean;
  onStatus: (id: string, status: OrderStatus) => void;
}) {
  return (
    <section className={panelClass()}>
      <SectionHeader eyebrow="Comercial" title="Pedidos" total={orders.length} />
      <AdminTable columns={["Cliente", "Item", "Valor", "Status", "Acoes"]} empty="Nenhum pedido cadastrado." isLoading={isLoading}>
        {orders.map((order) => (
          <tr className="align-top" key={order.id}>
            <td className="px-4 py-4">
              <strong>{order.customer.name}</strong>
              <p className="mt-1 text-xs text-[var(--muted)]">{order.customer.email}</p>
            </td>
            <td className="px-4 py-4">{order.terrain?.title ?? order.project?.title ?? "Pedido sem item"}</td>
            <td className="px-4 py-4">{money(order.total)}</td>
            <td className="px-4 py-4">{statusPill(order.status)}</td>
            <td className="px-4 py-4">
              <div className="flex min-w-[310px] flex-wrap gap-2">
                {orderStatuses.map((status) => (
                  <ActionButton disabled={pending} key={status} onClick={() => onStatus(order.id, status)}>
                    {statusLabel(status)}
                  </ActionButton>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}

function AnnouncementsSection({
  terrains,
  isLoading,
  pending,
  onApprove,
  onArchive
}: {
  terrains: Terrain[];
  isLoading: boolean;
  pending: boolean;
  onApprove: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  return (
    <section className={panelClass()}>
      <SectionHeader eyebrow="Fila" title="Anuncios de terrenos" total={terrains.length} />
      <AdminTable columns={["Terreno", "Proprietario", "Valor", "Status", "Acoes"]} empty="Nenhum anuncio pendente." isLoading={isLoading}>
        {terrains.map((terrain) => (
          <tr className="align-top" key={terrain.id}>
            <td className="px-4 py-4">
              <strong>{terrain.title}</strong>
              <p className="mt-1 text-xs text-[var(--muted)]">{[terrain.city, terrain.state].filter(Boolean).join(" / ")}</p>
            </td>
            <td className="px-4 py-4">{terrain.owner?.name ?? "Sem proprietario"}</td>
            <td className="px-4 py-4">{money(terrain.price)}</td>
            <td className="px-4 py-4">{statusPill(terrain.status)}</td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <ActionButton disabled={pending} onClick={() => onApprove(terrain.id)} tone="success">
                  Publicar
                </ActionButton>
                <ActionButton disabled={pending} onClick={() => onArchive(terrain.id)} tone="danger">
                  Recusar
                </ActionButton>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
    </section>
  );
}

function EventsSection({
  events,
  isLoading,
  meta,
  onPageChange,
  onSearch,
  search
}: {
  events: Array<Awaited<ReturnType<typeof getAdminEvents>>["items"][number]>;
  isLoading: boolean;
  meta: Awaited<ReturnType<typeof getAdminEvents>>["meta"];
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  search: string;
}) {
  const [searchDraft, setSearchDraft] = useState(search);
  const totalPages = Math.max(meta.totalPages, 1);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => Math.min(Math.max(meta.page - 2, 1), Math.max(totalPages - 4, 1)) + index
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(searchDraft.trim());
  }

  return (
    <section className={panelClass()}>
      <SectionHeader eyebrow="Acessos" title="Eventos do site" total={meta.total} />

      <form className="mb-5 flex flex-col gap-2 sm:flex-row" onSubmit={submitSearch}>
        <label className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={17}
          />
          <input
            className={`${inputClass()} pl-10`}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Buscar caminho, tipo, nome ou e-mail"
            value={searchDraft}
          />
        </label>
        <Button className="sm:w-auto" type="submit" variant="secondary">
          <Search size={17} />
          Buscar
        </Button>
        {search ? (
          <Button
            onClick={() => {
              setSearchDraft("");
              onSearch("");
            }}
            type="button"
            variant="ghost"
          >
            Limpar
          </Button>
        ) : null}
      </form>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="rounded-[8px] border border-[var(--line)] p-5 text-sm text-[var(--muted)]">Carregando acessos...</div>
        ) : events.length ? (
          events.map((event) => (
            <article className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-4" key={event.id}>
              <div className="flex items-start justify-between gap-3">
                <strong className="min-w-0 break-all text-sm">{event.path}</strong>
                {statusPill(event.type === "page_view" ? "Visualização" : event.type)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block uppercase text-[var(--muted)]">Usuário</span>
                  <span className="mt-1 block font-semibold">{event.user?.name ?? "Visitante"}</span>
                </div>
                <div>
                  <span className="block uppercase text-[var(--muted)]">Data e hora</span>
                  <span className="mt-1 block font-semibold">{dateTime(event.createdAt)}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[8px] border border-[var(--line)] p-5 text-sm text-[var(--muted)]">
            Nenhum acesso registrado.
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <AdminTable columns={["Caminho", "Tipo", "Usuário", "Quando"]} empty="Nenhum acesso registrado." isLoading={isLoading}>
          {events.map((event) => (
            <tr className="align-top" key={event.id}>
              <td className="max-w-md break-all px-4 py-4 font-medium">{event.path}</td>
              <td className="px-4 py-4">{statusPill(event.type === "page_view" ? "Visualização" : event.type)}</td>
              <td className="px-4 py-4">
                <strong className="block">{event.user?.name ?? "Visitante"}</strong>
                {event.user?.email ? <span className="mt-1 block text-xs text-[var(--muted)]">{event.user.email}</span> : null}
              </td>
              <td className="whitespace-nowrap px-4 py-4">{dateTime(event.createdAt)}</td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)]">
          Página <strong className="text-[var(--foreground)]">{meta.page}</strong> de{" "}
          <strong className="text-[var(--foreground)]">{totalPages}</strong>
        </p>
        <div className="flex items-center gap-1">
          <button
            aria-label="Página anterior"
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] disabled:opacity-40"
            disabled={meta.page <= 1 || isLoading}
            onClick={() => onPageChange(meta.page - 1)}
            title="Página anterior"
            type="button"
          >
            <ChevronLeft size={17} />
          </button>
          {pageNumbers.map((page) => (
            <button
              aria-current={page === meta.page ? "page" : undefined}
              className={`focus-ring inline-flex h-9 min-w-9 items-center justify-center rounded-[8px] border px-2 text-sm font-semibold ${
                page === meta.page
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] hover:bg-black/5 dark:hover:bg-white/10"
              }`}
              disabled={isLoading}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          ))}
          <button
            aria-label="Próxima página"
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] disabled:opacity-40"
            disabled={meta.page >= totalPages || isLoading}
            onClick={() => onPageChange(meta.page + 1)}
            title="Próxima página"
            type="button"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, total }: { eyebrow: string; title: string; total: number }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <div>
        <p className="text-sm uppercase text-[var(--muted)]">{eyebrow}</p>
        <h3 className="mt-1 text-2xl font-semibold">{title}</h3>
      </div>
      <span className="inline-flex w-fit rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
        {total}
      </span>
    </div>
  );
}
