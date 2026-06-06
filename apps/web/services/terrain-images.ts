import { api, unwrap } from "./api";
import { AssetImage } from "@/types/domain";

export type CreateTerrainImageInput = {
  terrainId: string;
  url: string;
  storageKey?: string;
  altText?: string;
  sortOrder?: number;
  isCover?: boolean;
};

export async function createTerrainImage(input: CreateTerrainImageInput) {
  const response = await api.post<AssetImage>("/terrain-images", input);
  return unwrap<AssetImage>(response);
}
