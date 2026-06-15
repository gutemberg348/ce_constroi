"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { resolveTerrainCreci } from "@/lib/terrain-metadata";
import { getSiteSettings } from "@/services/settings";

export function TerrainCreciBadge({
  metadata,
  overlay = false
}: {
  metadata?: Record<string, unknown>;
  overlay?: boolean;
}) {
  const settingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings
  });
  const creci = resolveTerrainCreci(metadata, settingsQuery.data?.defaultCreci);

  if (!creci) {
    return null;
  }

  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-[6px] border px-2 text-[11px] font-semibold uppercase ${
        overlay
          ? "border-white/25 bg-[#061733]/88 text-white shadow-lg backdrop-blur-sm"
          : "border-[color-mix(in_srgb,var(--accent)_25%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--panel))] text-[var(--accent)]"
      }`}
      title={`Anúncio vinculado ao ${creci}`}
    >
      <BadgeCheck size={13} />
      {creci}
    </span>
  );
}
