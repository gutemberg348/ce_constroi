import { api, unwrap } from "./api";
import { Paginated, Project } from "@/types/domain";

export type CreateProjectInput = {
  title: string;
  description: string;
  style?: string;
  bedrooms: number;
  bathrooms: number;
  suites?: number;
  parkingSpaces?: number;
  floors?: number;
  areaM2: number;
  estimatedBuildCost: number;
  price: number;
  renderUrl?: string;
  floorPlanUrl?: string;
};

export async function getProjects(params?: Record<string, string | number | undefined>) {
  const response = await api.get<Paginated<Project>>("/projects", { params });
  return unwrap<Paginated<Project>>(response);
}

export async function getProject(id: string) {
  const response = await api.get<Project>(`/projects/${id}`);
  return unwrap<Project>(response);
}

export async function createProject(input: CreateProjectInput) {
  const response = await api.post<Project>("/projects", input);
  return unwrap<Project>(response);
}
