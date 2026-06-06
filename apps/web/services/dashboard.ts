import { api, unwrap } from "./api";
import { UserDashboard } from "@/types/domain";

export async function getMyDashboard() {
  const response = await api.get<UserDashboard>("/dashboard/me");
  return unwrap<UserDashboard>(response);
}
