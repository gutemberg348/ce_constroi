"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  Building2,
  Calculator,
  Heart,
  Info,
  LogOut,
  Map,
  Megaphone,
  Menu,
  MessageCircle,
  UserRound,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CookiePreferencesButton } from "@/components/privacy/cookie-preferences-button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
  WhatsappIcon,
  XSocialIcon,
  YoutubeIcon
} from "@/components/ui/social-brand-icons";
import { trackSiteEvent } from "@/services/analytics";
import { defaultSiteSettings, getSiteSettings } from "@/services/settings";
import { useAuthStore } from "@/stores/auth-store";
import type { SiteSettings } from "@/types/domain";

const desktopLinks: Array<{ href: Route; label: string; icon: LucideIcon }> = [
  { href: "/terrenos", label: "Terrenos", icon: Map },
  { href: "/projetos", label: "Projetos", icon: Building2 },
  { href: "/simulacao", label: "Simulacao", icon: Calculator }
];

const mobileLinks: Array<{ href: Route; label: string; icon: LucideIcon }> = [
  ...desktopLinks,
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

type SocialLink = {
  label: string;
  url: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  className: string;
};

function socialLinks(settings: SiteSettings): SocialLink[] {
  const links: Array<Omit<SocialLink, "url"> & { url?: string | null }> = [
    {
      label: "Instagram",
      url: settings.socialInstagramUrl,
      icon: InstagramIcon,
      className: "border-pink-500 bg-gradient-to-br from-fuchsia-600 via-pink-500 to-amber-400 text-white shadow-pink-500/25 hover:shadow-lg"
    },
    {
      label: "Facebook",
      url: settings.socialFacebookUrl,
      icon: FacebookIcon,
      className: "border-[#1877f2] bg-[#1877f2] text-white shadow-blue-600/25 hover:shadow-lg"
    },
    {
      label: "YouTube",
      url: settings.socialYoutubeUrl,
      icon: YoutubeIcon,
      className: "border-[#ff0033] bg-[#ff0033] text-white shadow-red-600/25 hover:shadow-lg"
    },
    {
      label: "X",
      url: settings.socialXUrl,
      icon: XSocialIcon,
      className: "border-slate-950 bg-slate-950 text-white shadow-slate-900/25 hover:shadow-lg"
    },
    {
      label: "TikTok",
      url: settings.socialTiktokUrl,
      icon: TiktokIcon,
      className: "border-slate-950 bg-slate-950 text-white shadow-cyan-500/25 hover:shadow-lg"
    },
    {
      label: "LinkedIn",
      url: settings.socialLinkedinUrl,
      icon: LinkedinIcon,
      className: "border-[#0a66c2] bg-[#0a66c2] text-white shadow-sky-700/25 hover:shadow-lg"
    },
    {
      label: "WhatsApp",
      url: settings.socialWhatsappUrl,
      icon: WhatsappIcon,
      className: "border-[#25d366] bg-[#25d366] text-white shadow-emerald-500/25 hover:shadow-lg"
    }
  ];

  return links.reduce<SocialLink[]>((items, item) => {
    const url = item.url?.trim() ?? "";

    if (url) {
      items.push({ ...item, url });
    }

    return items;
  }, []);
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
  const configuredSocialLinks = socialLinks(settings);
  const whatsappLink = configuredSocialLinks.find((item) => item.label === "WhatsApp");

  useEffect(() => {
    void trackSiteEvent({
      type: "page_view",
      path: pathname || "/"
    });
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#10284c]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <Link className="flex min-w-0 items-center gap-2 font-semibold" href="/">
            {hasLogo ? (
              <span className="relative flex h-[52px] w-40 shrink-0 items-center overflow-hidden sm:w-44">
                {logoLightUrl ? (
                  <img
                    alt={settings.brandName}
                    className="absolute left-0 top-1/2 w-full max-w-none -translate-y-1/2 select-none dark:hidden"
                    decoding="async"
                    src={logoLightUrl}
                  />
                ) : null}
                {logoDarkUrl ? (
                  <img
                    alt={settings.brandName}
                    className="absolute left-0 top-1/2 hidden w-full max-w-none -translate-y-1/2 select-none dark:block"
                    decoding="async"
                    src={logoDarkUrl}
                  />
                ) : null}
                <span className="sr-only">{settings.brandName}</span>
              </span>
            ) : isLoadingSettings ? (
              <span aria-hidden="true" className="h-[52px] w-40 shrink-0 rounded-[8px] bg-white/10 sm:w-44" />
            ) : (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#0d6efd] text-white">
                  C
                </span>
                <span>{settings.brandName}</span>
              </>
            )}
          </Link>
          <nav className="hidden items-center gap-1 xl:flex">
            {desktopLinks.map((item) => (
              <Link
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] px-2.5 text-sm text-white/74 transition hover:bg-white/10 hover:text-white"
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
              Anunciar terreno
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              aria-label="Favoritos"
              className="focus-ring hidden h-10 w-10 items-center justify-center rounded-[8px] text-white/74 hover:bg-white/10 hover:text-white xl:inline-flex"
              href="/favoritos"
              title="Favoritos"
            >
              <Heart size={18} />
            </Link>
            <ModeToggle />
            {isLoggedIn ? (
              <>
                <Link
                  className="focus-ring hidden h-10 items-center gap-2 rounded-[8px] px-3 text-sm font-semibold text-white/74 hover:bg-white/10 hover:text-white xl:inline-flex"
                  href={dashboardHref}
                >
                  <UserRound size={16} />
                  Painel
                </Link>
                <button
                  aria-label="Sair"
                  className="focus-ring hidden h-10 w-10 items-center justify-center rounded-[8px] border border-white/18 text-white hover:bg-white/10 xl:inline-flex"
                  onClick={logout}
                  title="Sair"
                  type="button"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link
                  className="focus-ring hidden h-10 items-center rounded-[8px] px-3 text-sm font-semibold text-white/74 hover:bg-white/10 hover:text-white xl:inline-flex"
                  href="/login"
                >
                  Entrar
                </Link>
                <Link
                  className="focus-ring hidden h-10 items-center rounded-[8px] bg-[#0d6efd] px-4 text-sm font-semibold text-white hover:bg-[#0b5ed7] xl:inline-flex"
                  href="/register"
                >
                  Criar conta
                </Link>
              </>
            )}
            <button
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/18 text-white xl:hidden"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              type="button"
            >
              {isMobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen ? (
          <div className="border-t border-white/10 bg-[#10284c] px-4 py-3 xl:hidden">
            <nav className="mx-auto grid max-w-[1500px] gap-2">
              {[announceLink, ...mobileLinks].map((item) => (
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
              <Link
                className="focus-ring inline-flex h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-semibold text-white/74 hover:bg-white/10 hover:text-white"
                href="/quem-somos"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Info size={17} />
                Quem somos
              </Link>
              {configuredSocialLinks.length ? (
                <div className="grid gap-2 pt-2">
                  <p className="px-3 text-xs font-semibold uppercase text-white/50">Redes sociais</p>
                  <div className="flex flex-wrap gap-2 px-3">
                    {configuredSocialLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <a
                          aria-label={item.label}
                          className={`focus-ring inline-flex h-11 w-11 items-center justify-center rounded-[8px] border transition hover:-translate-y-0.5 ${item.className}`}
                          href={item.url}
                          key={item.label}
                          onClick={() => setIsMobileMenuOpen(false)}
                          rel="noreferrer"
                          target="_blank"
                          title={item.label}
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {isLoggedIn ? (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#0d6efd] px-3 text-sm font-semibold text-white"
                    href={dashboardHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserRound size={17} />
                    Meu painel
                  </Link>
                  <button
                    className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-white/18 px-3 text-sm font-semibold text-white"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    type="button"
                  >
                    <LogOut size={17} />
                    Sair
                  </button>
                </div>
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
          <div className="flex flex-wrap items-center gap-3">
            {configuredSocialLinks.length ? (
              <div className="flex flex-wrap gap-2">
                {configuredSocialLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      aria-label={item.label}
                      className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[8px] border transition hover:-translate-y-0.5 ${item.className}`}
                      href={item.url}
                      key={item.label}
                      rel="noreferrer"
                      target="_blank"
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            ) : null}
            <Link className="font-semibold hover:text-[var(--foreground)]" href="/termos">
              Termos
            </Link>
            <Link className="font-semibold hover:text-[var(--foreground)]" href="/privacidade">
              Privacidade
            </Link>
            <Link className="font-semibold hover:text-[var(--foreground)]" href="/cookies">
              Cookies
            </Link>
            <Link className="font-semibold hover:text-[var(--foreground)]" href="/quem-somos">
              Quem somos
            </Link>
            <CookiePreferencesButton />
          </div>
        </div>
      </footer>
      {whatsappLink ? (
        <a
          aria-label="Falar no WhatsApp"
          className="focus-ring fixed bottom-5 right-5 z-40 inline-flex h-14 items-center gap-3 rounded-full bg-[#25d366] px-4 text-sm font-bold text-white shadow-[0_18px_45px_rgba(37,211,102,0.38)] transition hover:-translate-y-0.5 hover:bg-[#1ebe5d]"
          href={whatsappLink.url}
          rel="noreferrer"
          target="_blank"
        >
          <MessageCircle size={22} />
          <span className="hidden sm:inline">Falar no WhatsApp</span>
        </a>
      ) : null}
    </div>
  );
}
