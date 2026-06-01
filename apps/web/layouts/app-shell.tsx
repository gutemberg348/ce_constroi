"use client";

import Link from "next/link";
import type { Route } from "next";
import { Building2, Heart, LayoutDashboard, LogOut, Map, Search, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CookiePreferencesButton } from "@/components/privacy/cookie-preferences-button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useAuthStore } from "@/stores/auth-store";

const links: Array<{ href: Route; label: string; icon: LucideIcon }> = [
  { href: "/terrenos", label: "Terrenos", icon: Map },
  { href: "/projetos", label: "Projetos", icon: Building2 },
  { href: "/simulacao", label: "Simulacao", icon: Search },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
];

function getDashboardHref(role?: string): Route {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "ARCHITECT") {
    return "/painel-arquiteto";
  }

  return "/dashboard";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const isLoggedIn = Boolean(user && accessToken);
  const dashboardHref = getDashboardHref(user?.role);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#11150f] text-white dark:bg-white dark:text-[#11150f]">
              C
            </span>
            <span>Cê constroi</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((item) => (
              <Link
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] px-3 text-sm text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/10"
                href={item.href}
                key={item.href}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {isLoggedIn ? (
              <>
                <Link
                  className="focus-ring hidden h-10 items-center gap-2 rounded-[8px] px-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] sm:inline-flex"
                  href={dashboardHref}
                >
                  <UserRound size={16} />
                  {user?.name?.split(" ")[0] ?? "Painel"}
                </Link>
                <button
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 text-sm font-semibold text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={logout}
                  type="button"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  className="focus-ring hidden h-10 items-center rounded-[8px] px-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] sm:inline-flex"
                  href="/login"
                >
                  Entrar
                </Link>
                <Link
                  className="focus-ring inline-flex h-10 items-center rounded-[8px] bg-[#0f766e] px-4 text-sm font-semibold text-white hover:bg-[#0d655f] dark:bg-[#2dd4bf] dark:text-[#062522] dark:hover:bg-[#5eead4]"
                  href="/register"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-[var(--muted)] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Cê constroi - privacidade por padrao.</p>
          <div className="flex flex-wrap gap-4">
            <Link className="font-semibold hover:text-[var(--foreground)]" href="/termos">
              Termos
            </Link>
            <Link className="font-semibold hover:text-[var(--foreground)]" href="/privacidade">
              Privacidade
            </Link>
            <Link className="font-semibold hover:text-[var(--foreground)]" href="/cookies">
              Cookies
            </Link>
            <CookiePreferencesButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
