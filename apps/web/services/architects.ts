import { api, unwrap } from "./api";
import { ArchitectProfile } from "@/types/domain";

export type ArchitectStats = {
  projects: number;
  publishedProjects: number;
  paidOrders: number;
  conversionRate: number;
};

export async function getArchitectMe() {
  const response = await api.get<ArchitectProfile>("/architects/me");
  return unwrap<ArchitectProfile>(response);
}

export async function getArchitectStats() {
  const response = await api.get<ArchitectStats>("/architects/me/stats");
  return unwrap<ArchitectStats>(response);
}

export async function updateArchitectProfile(input: {
  companyName?: string;
  bio?: string;
  cauNumber?: string;
  website?: string;
}) {
  const response = await api.patch<ArchitectProfile>("/architects/me", input);
  return unwrap<ArchitectProfile>(response);
}
