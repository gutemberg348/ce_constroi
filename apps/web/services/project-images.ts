import { api, unwrap } from "./api";
import type { AssetImage } from "@/types/domain";

export type ProjectImageInput = {
  projectId: string;
  url: string;
  altText?: string;
  sortOrder?: number;
  isCover?: boolean;
};

export async function addProjectImage(input: ProjectImageInput) {
  const response = await api.post<AssetImage>("/project-images", input);
  return unwrap<AssetImage>(response);
}
