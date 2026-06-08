import { api, unwrap } from "./api";
import type { Project, Terrain } from "@/types/domain";

export type CompatibilityStatus = "SUGGESTED" | "APPROVED" | "REJECTED";

export type Compatibility = {
  id: string;
  terrainId: string;
  projectId: string;
  status: CompatibilityStatus;
  score: number | string;
  notes?: string;
  terrain?: Terrain;
  project?: Project;
};

export type UpsertCompatibilityInput = {
  terrainId: string;
  projectId: string;
  status?: CompatibilityStatus;
  score?: number;
  notes?: string;
};

export async function upsertCompatibility(input: UpsertCompatibilityInput) {
  const response = await api.post<Compatibility>("/compatibility", input);
  return unwrap<Compatibility>(response);
}
