"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/services/projects";

export function useProjects(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => getProjects(params)
  });
}
