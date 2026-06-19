"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export function AuthenticatedSimulationLink({
  children,
  className,
  href,
  variant = "primary"
}: {
  children: ReactNode;
  className?: string;
  href: string;
  variant?: "primary" | "secondary" | "light" | "ghost";
}) {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const targetHref = hasHydrated && accessToken && user ? href : `/login?next=${encodeURIComponent(href)}`;

  return (
    <Link className={className} href={targetHref as Route}>
      <Button className="w-full sm:w-auto" variant={variant}>
        {children}
      </Button>
    </Link>
  );
}
