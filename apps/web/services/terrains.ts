import { api, unwrap } from "./api";
import { Paginated, Terrain } from "@/types/domain";

export type CreateTerrainInput = {
  title: string;
  description: string;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  areaM2: number;
  price: number;
  frontageM?: number;
  depthM?: number;
  zoning?: string;
  metadata?: Record<string, unknown>;
};

export async function getTerrains(params?: Record<string, string | number | undefined>) {
  const response = await api.get<Paginated<Terrain>>("/terrains", { params });
  return unwrap<Paginated<Terrain>>(response);
}

export async function getAllTerrains(params?: Record<string, string | number | undefined>) {
  const firstPage = await getTerrains({ ...params, page: 1, limit: 100 });

  if (firstPage.meta.totalPages <= 1) {
    return firstPage;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
      getTerrains({ ...params, page: index + 2, limit: 100 })
    )
  );

  return {
    ...firstPage,
    items: [firstPage, ...remainingPages].flatMap((page) => page.items)
  };
}

export async function getTerrain(id: string) {
  const response = await api.get<Terrain>(`/terrains/${id}`);
  return unwrap<Terrain>(response);
}

export async function createTerrain(input: CreateTerrainInput) {
  const response = await api.post<Terrain>("/terrains", input);
  return unwrap<Terrain>(response);
}
