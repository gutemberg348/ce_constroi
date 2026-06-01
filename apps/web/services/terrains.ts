import { api, unwrap } from "./api";
import { terrainMocks } from "./mock-data";
import { Paginated, Terrain } from "@/types/domain";

export async function getTerrains(params?: Record<string, string | number | undefined>) {
  try {
    const response = await api.get<Paginated<Terrain>>("/terrains", { params });
    return unwrap<Paginated<Terrain>>(response);
  } catch {
    return {
      items: terrainMocks,
      meta: { page: 1, limit: terrainMocks.length, total: terrainMocks.length, totalPages: 1 }
    };
  }
}

export async function getTerrain(id: string) {
  try {
    const response = await api.get<Terrain>(`/terrains/${id}`);
    return unwrap<Terrain>(response);
  } catch {
    return terrainMocks.find((terrain) => terrain.id === id) ?? terrainMocks[0];
  }
}
