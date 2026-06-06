import { api, unwrap } from "./api";
import { Favorite } from "@/types/domain";

export type FavoriteInput = {
  terrainId?: string;
  projectId?: string;
};

export async function getFavorites() {
  const response = await api.get<Favorite[]>("/favorites");
  return unwrap<Favorite[]>(response);
}

export async function addFavorite(input: FavoriteInput) {
  const response = await api.post<Favorite>("/favorites", input);
  return unwrap<Favorite>(response);
}

export async function removeFavorite(id: string) {
  const response = await api.delete<Favorite>(`/favorites/${id}`);
  return unwrap<Favorite>(response);
}
