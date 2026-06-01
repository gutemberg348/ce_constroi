"use client";

import { useQuery } from "@tanstack/react-query";
import { getTerrains } from "@/services/terrains";

export function useTerrains(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ["terrains", params],
    queryFn: () => getTerrains(params)
  });
}
