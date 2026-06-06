import { api } from "./api";

export type SiteEventInput = {
  type: string;
  path: string;
  metadata?: Record<string, unknown>;
};

export async function trackSiteEvent(input: SiteEventInput) {
  try {
    await api.post("/analytics/events", input);
  } catch {
    // Analytics cannot block navigation or rendering.
  }
}
