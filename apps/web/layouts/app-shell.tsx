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
  const settings = settingsQuery.data ?? defaultSiteSettings;
  const logoLightUrl = settings.logoLightUrl || settings.logoUrl || settings.logoDarkUrl || null;
  const logoDarkUrl = settings.logoDarkUrl || settings.logoUrl || logoLightUrl;
  const hasLogo = Boolean(logoLightUrl || logoDarkUrl);

  useEffect(() => {
    void trackSiteEvent({
      type: "page_view",
      path: pathname || "/"
    });
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            {hasLogo ? (
              <span className="relative flex h-11 w-28 shrink-0 items-center overflow-hidden sm:w-40 md:w-44">
                {logoLightUrl ? (
                  <img alt={settings.brandName} className="h-full w-full object-contain dark:hidden" src={logoLightUrl} />
                ) : null}
                {logoDarkUrl ? (
                  <img alt={settings.brandName} className="hidden h-full w-full object-contain dark:block" src={logoDarkUrl} />
                ) : null}
                <span className="sr-only">{settings.brandName}</span>
              </span>
            ) : (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#11150f] text-white dark:bg-white dark:text-[#11150f]">
                  C
                </span>
                <span>{settings.brandName}</span>
              </>
            )}
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
            <Link
              className="focus-ring ml-2 inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0f766e] px-3 text-sm font-semibold text-white transition hover:bg-[#0d655f] dark:bg-[#2dd4bf] dark:text-[#062522] dark:hover:bg-[#5eead4]"
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
                  className="focus-ring hidden h-10 items-center gap-2 rounded-[8px] px-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] sm:inline-flex"
                  href={dashboardHref}
                >
                  <UserRound size={16} />
                  Meu painel
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
            <button
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--foreground)] md:hidden"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              type="button"
            >
              {isMobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen ? (
          <div className="border-t border-[var(--line)] bg-[var(--background)] px-4 py-3 md:hidden">
            <nav className="mx-auto grid max-w-7xl gap-2">
              {[announceLink, ...links].map((item) => (
                <Link
                  className={`focus-ring inline-flex h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-semibold ${
                    item.href === announceLink.href
                      ? "bg-[#0f766e] text-white dark:bg-[#2dd4bf] dark:text-[#062522]"
                      : "text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/10"
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
                  className="focus-ring inline-flex h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-semibold text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/10"
                  href={dashboardHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserRound size={17} />
                  Meu painel
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    className="focus-ring inline-flex h-11 items-center justify-center rounded-[8px] border border-[var(--line)] text-sm font-semibold"
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link
                    className="focus-ring inline-flex h-11 items-center justify-center rounded-[8px] bg-[#11150f] text-sm font-semibold text-white dark:bg-white dark:text-[#11150f]"
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
