import type { Route } from "next";

const blockedRedirectPrefixes = ["/admin", "/dashboard", "/painel-arquiteto"];

export function getSafePostAuthPath(value: string | null): Route {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  if (blockedRedirectPrefixes.some((path) => value === path || value.startsWith(`${path}/`))) {
    return "/";
  }

  return value as Route;
}
