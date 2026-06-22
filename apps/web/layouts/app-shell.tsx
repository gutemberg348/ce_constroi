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
      className:
        "border-[var(--line)] bg-[var(--panel)] text-[#d62976] shadow-[0_8px_22px_rgba(15,23,42,0.06)] hover:border-pink-500/35 hover:bg-pink-500/10 dark:bg-white/5 dark:hover:bg-pink-500/15"
    },
    {
      label: "Facebook",
      url: settings.socialFacebookUrl,
      icon: FacebookIcon,
      className:
        "border-[var(--line)] bg-[var(--panel)] text-[#1877f2] shadow-[0_8px_22px_rgba(15,23,42,0.06)] hover:border-blue-500/35 hover:bg-blue-500/10 dark:bg-white/5 dark:hover:bg-blue-500/15"
    },
    {
      label: "YouTube",
      url: settings.socialYoutubeUrl,
      icon: YoutubeIcon,
      className:
        "border-[var(--line)] bg-[var(--panel)] text-[#ff0033] shadow-[0_8px_22px_rgba(15,23,42,0.06)] hover:border-red-500/35 hover:bg-red-500/10 dark:bg-white/5 dark:hover:bg-red-500/15"
    },
    {
      label: "X",
      url: settings.socialXUrl,
      icon: XSocialIcon,
      className:
        "border-[var(--line)] bg-[var(--panel)] text-slate-950 shadow-[0_8px_22px_rgba(15,23,42,0.06)] hover:border-slate-500/35 hover:bg-slate-500/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
    },
    {
      label: "TikTok",
      url: settings.socialTiktokUrl,
      icon: TiktokIcon,
      className:
        "border-[var(--line)] bg-[var(--panel)] text-slate-950 shadow-[0_8px_22px_rgba(15,23,42,0.06)] hover:border-cyan-500/35 hover:bg-cyan-500/10 dark:bg-white/5 dark:text-white dark:hover:bg-cyan-500/15"
    },
    {
      label: "LinkedIn",
      url: settings.socialLinkedinUrl,
      icon: LinkedinIcon,
      className:
        "border-[var(--line)] bg-[var(--panel)] text-[#0a66c2] shadow-[0_8px_22px_rgba(15,23,42,0.06)] hover:border-sky-600/35 hover:bg-sky-600/10 dark:bg-white/5 dark:hover:bg-sky-600/15"
    },
    {
      label: "WhatsApp",
      url: settings.socialWhatsappUrl,
      icon: WhatsappIcon,
      className:
        "border-[var(--line)] bg-[var(--panel)] text-[#1fa855] shadow-[0_8px_22px_rgba(15,23,42,0.06)] hover:border-emerald-500/35 hover:bg-emerald-500/10 dark:bg-white/5 dark:hover:bg-emerald-500/15"
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
  const footerLogoUrl = logoLightUrl || logoDarkUrl;
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
                  <div className="mx-3 flex w-fit flex-wrap gap-1.5 rounded-[8px] border border-white/10 bg-white/[0.04] p-1.5">
                    {configuredSocialLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <a
                          aria-label={item.label}
                          className={`focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[8px] border transition hover:-translate-y-0.5 ${item.className}`}
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
      <footer className="border-t border-white/10 bg-[#0b1d38] text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
            <div className="max-w-md">
              <Link className="inline-flex items-center" href="/">
                {footerLogoUrl ? (
                  <img
                    alt={settings.brandName}
                    className="h-12 w-auto max-w-[220px] object-contain"
                    decoding="async"
                    src={footerLogoUrl}
                  />
                ) : (
                  <span className="text-xl font-semibold">{settings.brandName}</span>
                )}
              </Link>
              <p className="mt-4 text-sm leading-6 text-white/72">
                Da escolha do terreno a simulacao do financiamento, uma plataforma para planejar sua casa com mais clareza e seguranca.
              </p>

              {configuredSocialLinks.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
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
                        <Icon className="h-[19px] w-[19px]" />
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Plataforma</h2>
              <nav className="mt-4 grid gap-3 text-sm text-white/72">
                <Link className="transition hover:text-white" href="/terrenos">
                  Terrenos
                </Link>
                <Link className="transition hover:text-white" href="/projetos">
                  Projetos
                </Link>
                <Link className="transition hover:text-white" href="/simulacao">
                  Simulacao
                </Link>
                <Link className="transition hover:text-white" href="/anunciar-terreno">
                  Anunciar terreno
                </Link>
              </nav>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Empresa</h2>
              <nav className="mt-4 grid gap-3 text-sm text-white/72">
                <Link className="transition hover:text-white" href="/quem-somos">
                  Quem somos
                </Link>
                <Link className="transition hover:text-white" href="/termos">
                  Termos de uso
                </Link>
                <Link className="transition hover:text-white" href="/privacidade">
                  Privacidade
                </Link>
                <Link className="transition hover:text-white" href="/cookies">
                  Cookies
                </Link>
                <CookiePreferencesButton className="justify-start p-0 text-white/72 hover:text-white" />
              </nav>
            </div>

            <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-sm font-semibold">Atendimento especializado</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Fale com a equipe para tirar duvidas sobre terreno, projeto e viabilidade.
              </p>
              {whatsappLink ? (
                <a
                  className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#0d6efd] px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0b5ed7]"
                  href={whatsappLink.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle size={18} />
                  Falar no WhatsApp
                </a>
              ) : (
                <Link
                  className="focus-ring mt-4 inline-flex w-full items-center justify-center rounded-[8px] bg-[#0d6efd] px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0b5ed7]"
                  href="/register"
                >
                  Criar conta
                </Link>
              )}
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>{settings.brandName} - {new Date().getFullYear()}. Todos os direitos reservados.</p>
            <p>Construcao planejada, dados protegidos e atendimento claro.</p>
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
