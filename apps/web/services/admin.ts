import { api, unwrap } from "./api";
import { AdminMetrics, ArchitectProfile, ArchitectStatus } from "@/types/domain";

export async function getAdminMetrics() {
  const response = await api.get<AdminMetrics>("/admin/metrics");
  return unwrap<AdminMetrics>(response);
}

export async function getArchitectsForReview(status: ArchitectStatus = "PENDING_REVIEW") {
  const response = await api.get<ArchitectProfile[]>("/admin/architects", {
    params: { status }
  });
  return unwrap<ArchitectProfile[]>(response);
}

export async function approveArchitect(id: string) {
  const response = await api.patch<ArchitectProfile>(`/admin/architects/${id}/approve`);
  return unwrap<ArchitectProfile>(response);
}

export async function rejectArchitect(id: string, reason?: string) {
  const response = await api.patch<ArchitectProfile>(`/admin/architects/${id}/reject`, {
    reason
  });
  return unwrap<ArchitectProfile>(response);
}
