"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, Calculator, Heart, LogOut, Map, Megaphone, Menu, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CookiePreferencesButton } from "@/components/privacy/cookie-preferences-button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { trackSiteEvent } from "@/services/analytics";
import { defaultSiteSettings, getSiteSettings } from "@/services/settings";
import { useAuthStore } from "@/stores/auth-store";

const links: Array<{ href: Route; label: string; icon: LucideIcon }> = [
  { href: "/terrenos", label: "Terrenos", icon: Map },
  { href: "/projetos", label: "Projetos", icon: Building2 },
  { href: "/simulacao", label: "Simulacao", icon: Calculator },
  { href: "/favoritos", label: "Favoritos", icon: Heart }
];

const announceLink: { href: Route; label: string; icon: LucideIcon } = {
  href: "/anunciar-terreno",
  label: "Anunciar meu terreno",
  icon: Megaphone
};

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const settingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings
  });
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const isLoggedIn = Boolean(user && accessToken);
  const dashboardHref = getDashboardHref(user?.role);
  const loadedSettings = settingsQuery.data;
  const settings = loadedSettings ?? defaultSiteSettings;
  const logoLightUrl = loadedSettings?.logoLightUrl || loadedSettings?.logoUrl || loadedSettings?.logoDarkUrl || null;
  const logoDarkUrl = loadedSettings?.logoDarkUrl || loadedSettings?.logoUrl || logoLightUrl;
  const hasLogo = Boolean(logoLightUrl || logoDarkUrl);
  const isLoadingSettings = !loadedSettings && settingsQuery.isPending;

  useEffect(() => {
    void trackSiteEvent({
      type: "page_view",
      path: pathname || "/"
    });
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#10284c]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-2 font-semibold" href="/">
            {hasLogo ? (
              <span className="relative flex h-[52px] w-44 shrink-0 items-center overflow-hidden sm:w-56 md:w-64">
                {logoLightUrl ? (
                  <img alt={settings.brandName} className="absolute left-0 top-1/2 w-full max-w-none -translate-y-1/2 dark:hidden" src={logoLightUrl} />
                ) : null}
                {logoDarkUrl ? (
                  <img alt={settings.brandName} className="absolute left-0 top-1/2 hidden w-full max-w-none -translate-y-1/2 dark:block" src={logoDarkUrl} />
                ) : null}
                <span className="sr-only">{settings.brandName}</span>
              </span>
            ) : isLoadingSettings ? (
              <span aria-hidden="true" className="h-[52px] w-44 shrink-0 rounded-[8px] bg-white/10 sm:w-56 md:w-64" />
            ) : (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#0d6efd] text-white">
                  C
                </span>
                <span>{settings.brandName}</span>
              </>
            )}
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((item) => (
              <Link
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] px-3 text-sm text-white/74 transition hover:bg-white/10 hover:text-white"
                href={item.href}
                key={item.href}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            <Link
              className="focus-ring ml-2 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0d6efd] px-3 text-sm font-semibold text-white transition hover:bg-[#0b5ed7]"
              href={announceLink.href}
            >
              <announceLink.icon size={16} />
              {announceLink.label}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {isLoggedIn ? (
              <>
                <Link
                  className="focus-ring hidden h-10 items-center gap-2 rounded-[8px] px-3 text-sm font-semibold text-white/74 hover:bg-white/10 hover:text-white sm:inline-flex"
                  href={dashboardHref}
                >
                  <UserRound size={16} />
                  Meu painel
                </Link>
                <button
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] border border-white/18 px-3 text-sm font-semibold text-white hover:bg-white/10"
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
                  className="focus-ring hidden h-10 items-center rounded-[8px] px-3 text-sm font-semibold text-white/74 hover:bg-white/10 hover:text-white sm:inline-flex"
                  href="/login"
                >
                  Entrar
                </Link>
                <Link
                  className="focus-ring inline-flex h-10 items-center rounded-[8px] bg-[#0d6efd] px-4 text-sm font-semibold text-white hover:bg-[#0b5ed7]"
                  href="/register"
                >
                  Criar conta
                </Link>
              </>
            )}
            <button
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/18 text-white md:hidden"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              type="button"
            >
              {isMobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen ? (
          <div className="border-t border-white/10 bg-[#10284c] px-4 py-3 md:hidden">
            <nav className="mx-auto grid max-w-7xl gap-2">
              {[announceLink, ...links].map((item) => (
                <Link
                  className={`focus-ring inline-flex h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-semibold ${
                    item.href === announceLink.href
                      ? "bg-[#0d6efd] text-white"
                      : "text-white/74 hover:bg-white/10 hover:text-white"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon size={17} />
                  {item.label}
                </Link>
              ))}
              {isLoggedIn ? (
                <Link
                  className="focus-ring inline-flex h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-semibold text-white/74 hover:bg-white/10 hover:text-white"
                  href={dashboardHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserRound size={17} />
                  Meu painel
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    className="focus-ring inline-flex h-11 items-center justify-center rounded-[8px] border border-white/18 text-sm font-semibold text-white"
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link
                    className="focus-ring inline-flex h-11 items-center justify-center rounded-[8px] bg-[#0d6efd] text-sm font-semibold text-white"
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Criar conta
                  </Link>
                </div>
              )}
            </nav>
          </div>
        ) : null}
      </header>
      <main>{children}</main>
      <footer className="border-t border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-[var(--muted)] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>{settings.brandName} - privacidade por padrao.</p>
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
