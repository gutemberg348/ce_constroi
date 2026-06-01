import { api, unwrap } from "./api";
import { projectMocks } from "./mock-data";
import { Paginated, Project } from "@/types/domain";

export async function getProjects(params?: Record<string, string | number | undefined>) {
  try {
    const response = await api.get<Paginated<Project>>("/projects", { params });
    return unwrap<Paginated<Project>>(response);
  } catch {
    return {
      items: projectMocks,
      meta: { page: 1, limit: projectMocks.length, total: projectMocks.length, totalPages: 1 }
    };
  }
}

export async function getProject(id: string) {
  try {
    const response = await api.get<Project>(`/projects/${id}`);
    return unwrap<Project>(response);
  } catch {
    return projectMocks.find((project) => project.id === id) ?? projectMocks[0];
  }
}
