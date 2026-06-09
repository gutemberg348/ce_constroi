import { api, unwrap } from "./api";
import {
  AdminMetrics,
  AdminOrder,
  AdminOverview,
  AdminSimulation,
  AdminUser,
  AssetImage,
  ArchitectProfile,
  ArchitectStatus,
  OrderStatus,
  Paginated,
  Project,
  ProjectStatus,
  SimulationStatus,
  SiteEvent,
  Terrain,
  TerrainStatus,
  UserStatus
} from "@/types/domain";

type AdminListParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  type?: string;
};

export async function getAdminMetrics() {
  const response = await api.get<AdminMetrics>("/admin/metrics");
  return unwrap<AdminMetrics>(response);
}

export async function getAdminOverview() {
  const response = await api.get<AdminOverview>("/admin/overview");
  return unwrap<AdminOverview>(response);
}

export async function getArchitectsForReview(status?: ArchitectStatus) {
  const response = await api.get<ArchitectProfile[]>("/admin/architects", {
    params: status ? { status } : undefined
  });
  return unwrap<ArchitectProfile[]>(response);
}

export type CreateAdminArchitectInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  companyName?: string;
  cauNumber?: string;
  website?: string;
  bio?: string;
  status?: ArchitectStatus;
};

export async function createAdminArchitect(input: CreateAdminArchitectInput) {
  const response = await api.post<ArchitectProfile>("/admin/architects", input);
  return unwrap<ArchitectProfile>(response);
}

export async function getAdminUsers(params?: AdminListParams) {
  const response = await api.get<Paginated<AdminUser>>("/admin/users", { params });
  return unwrap<Paginated<AdminUser>>(response);
}

export async function updateAdminUserStatus(id: string, status: UserStatus) {
  const response = await api.patch<AdminUser>(`/admin/users/${id}/status`, { status });
  return unwrap<AdminUser>(response);
}

export type UpdateAdminUserInput = Partial<Pick<AdminUser, "name" | "email" | "phone" | "document" | "role" | "status">>;

export async function updateAdminUser(id: string, input: UpdateAdminUserInput) {
  const response = await api.patch<AdminUser>(`/admin/users/${id}`, input);
  return unwrap<AdminUser>(response);
}

export async function deleteAdminUser(id: string) {
  const response = await api.delete<AdminUser>(`/admin/users/${id}`);
  return unwrap<AdminUser>(response);
}

export async function getAdminTerrains(params?: AdminListParams) {
  const response = await api.get<Paginated<Terrain>>("/admin/terrains", { params });
  return unwrap<Paginated<Terrain>>(response);
}

export async function updateAdminTerrainStatus(id: string, status: TerrainStatus) {
  const response = await api.patch<Terrain>(`/admin/terrains/${id}/status`, { status });
  return unwrap<Terrain>(response);
}

export type UpdateAdminTerrainInput = Partial<
  Pick<
    Terrain,
    "title" | "description" | "address" | "neighborhood" | "city" | "state" | "areaM2" | "frontageM" | "depthM" | "price"
  >
> & {
  zipCode?: string;
  zoning?: string;
};

export type AdminImageInput = {
  url: string;
  storageKey?: string;
  altText?: string;
  sortOrder?: number;
  isCover?: boolean;
};

export async function updateAdminTerrain(id: string, input: UpdateAdminTerrainInput) {
  const response = await api.patch<Terrain>(`/admin/terrains/${id}`, input);
  return unwrap<Terrain>(response);
}

export async function deleteAdminTerrain(id: string) {
  const response = await api.delete<Terrain>(`/admin/terrains/${id}`);
  return unwrap<Terrain>(response);
}

export async function addAdminTerrainImage(terrainId: string, input: AdminImageInput) {
  const response = await api.post<AssetImage>(`/admin/terrains/${terrainId}/images`, {
    ...input,
    terrainId,
    storageKey: input.storageKey || input.url
  });
  return unwrap<AssetImage>(response);
}

export async function removeAdminTerrainImage(imageId: string) {
  const response = await api.delete<AssetImage>(`/admin/terrain-images/${imageId}`);
  return unwrap<AssetImage>(response);
}

export async function getAdminProjects(params?: AdminListParams) {
  const response = await api.get<Paginated<Project>>("/admin/projects", { params });
  return unwrap<Paginated<Project>>(response);
}

export async function updateAdminProjectStatus(id: string, status: ProjectStatus) {
  const response = await api.patch<Project>(`/admin/projects/${id}/status`, { status });
  return unwrap<Project>(response);
}

export type UpdateAdminProjectInput = Partial<
  Pick<
    Project,
    | "title"
    | "description"
    | "style"
    | "bedrooms"
    | "bathrooms"
    | "areaM2"
    | "estimatedBuildCost"
    | "price"
    | "renderUrl"
    | "floorPlanUrl"
  >
> & {
  suites?: number;
  parkingSpaces?: number;
  floors?: number;
  architectId?: string;
};

export async function updateAdminProject(id: string, input: UpdateAdminProjectInput) {
  const response = await api.patch<Project>(`/admin/projects/${id}`, input);
  return unwrap<Project>(response);
}

export async function deleteAdminProject(id: string) {
  const response = await api.delete<Project>(`/admin/projects/${id}`);
  return unwrap<Project>(response);
}

export async function addAdminProjectImage(projectId: string, input: AdminImageInput) {
  const response = await api.post<AssetImage>(`/admin/projects/${projectId}/images`, {
    ...input,
    projectId,
    storageKey: input.storageKey || input.url
  });
  return unwrap<AssetImage>(response);
}

export async function removeAdminProjectImage(imageId: string) {
  const response = await api.delete<AssetImage>(`/admin/project-images/${imageId}`);
  return unwrap<AssetImage>(response);
}

export async function getAdminSimulations(params?: AdminListParams) {
  const response = await api.get<Paginated<AdminSimulation>>("/admin/simulations", { params });
  return unwrap<Paginated<AdminSimulation>>(response);
}

export async function updateAdminSimulationStatus(id: string, status: SimulationStatus) {
  const response = await api.patch<AdminSimulation>(`/admin/simulations/${id}/status`, { status });
  return unwrap<AdminSimulation>(response);
}

export async function deleteAdminSimulation(id: string) {
  const response = await api.delete<AdminSimulation>(`/admin/simulations/${id}`);
  return unwrap<AdminSimulation>(response);
}

export async function getAdminOrders(params?: AdminListParams) {
  const response = await api.get<Paginated<AdminOrder>>("/admin/orders", { params });
  return unwrap<Paginated<AdminOrder>>(response);
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus) {
  const response = await api.patch<AdminOrder>(`/admin/orders/${id}/status`, { status });
  return unwrap<AdminOrder>(response);
}

export async function getAdminEvents(params?: AdminListParams) {
  const response = await api.get<Paginated<SiteEvent>>("/admin/events", { params });
  return unwrap<Paginated<SiteEvent>>(response);
}

export async function approveArchitect(id: string) {
  const response = await api.patch<ArchitectProfile>(`/admin/architects/${id}/approve`);
  return unwrap<ArchitectProfile>(response);
}

export type UpdateAdminArchitectInput = Partial<
  Pick<ArchitectProfile, "companyName" | "bio" | "cauNumber" | "website" | "rejectionReason" | "status">
>;

export async function updateAdminArchitect(id: string, input: UpdateAdminArchitectInput) {
  const response = await api.patch<ArchitectProfile>(`/admin/architects/${id}`, input);
  return unwrap<ArchitectProfile>(response);
}

export async function deleteAdminArchitect(id: string) {
  const response = await api.delete<ArchitectProfile>(`/admin/architects/${id}`);
  return unwrap<ArchitectProfile>(response);
}

export async function rejectArchitect(id: string, reason?: string) {
  const response = await api.patch<ArchitectProfile>(`/admin/architects/${id}/reject`, {
    reason
  });
  return unwrap<ArchitectProfile>(response);
}

export async function approveTerrain(id: string) {
  const response = await api.patch<Terrain>(`/admin/terrains/${id}/approve`);
  return unwrap<Terrain>(response);
}

export async function archiveTerrain(id: string) {
  const response = await api.patch<Terrain>(`/admin/terrains/${id}/archive`);
  return unwrap<Terrain>(response);
}
