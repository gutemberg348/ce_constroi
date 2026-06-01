"use client";

import Link from "next/link";
import { ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConsentSettings, useConsentStore } from "@/stores/consent-store";

const categories: Array<{
  key: keyof ConsentSettings;
  label: string;
  description: string;
  locked?: boolean;
}> = [
  {
    key: "necessary",
    label: "Necessarios",
    description: "Mantem seguranca, autenticacao, registro da sua escolha de privacidade e funcionamento basico.",
    locked: true
  },
  {
    key: "preferences",
    label: "Preferencias",
    description: "Guarda escolhas de interface, tema e preferencias de navegacao."
  },
  {
    key: "media",
    label: "Midia opcional",
    description: "Libera recursos externos que nao sejam essenciais para catalogo, banners e navegacao basica."
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Permite metricas agregadas para melhorar o produto. Nenhum script e carregado antes do aceite."
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Reservado para campanhas, remarketing e midias pagas. Desligado por padrao."
  }
];

export function CookieConsent() {
  const {
    acceptAll,
    close,
    hasDecided,
    hasHydrated,
    isOpen,
    open,
    rejectOptional,
    saveSettings,
    settings
  } = useConsentStore();
  const [draft, setDraft] = useState<ConsentSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings, isOpen]);

  if (!hasHydrated) {
    return null;
  }

  const shouldShowBanner = !hasDecided;
  const shouldShowModal = isOpen;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveSettings(draft);
  }

  return (
    <>
      {shouldShowBanner ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_96%,transparent)] shadow-2xl backdrop-blur-xl">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
            <div className="flex gap-3">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h2 className="text-base font-semibold">Controle de privacidade e cookies</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Por padrao, mantemos analytics, marketing e recursos opcionais desligados ate voce permitir.
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-[var(--accent)]">
                  <Link href="/privacidade">Privacidade</Link>
                  <Link href="/cookies">Politica de cookies</Link>
                  <Link href="/termos">Termos</Link>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button onClick={rejectOptional} type="button" variant="ghost">
                Rejeitar opcionais
              </Button>
              <Button onClick={open} type="button" variant="secondary">
                <SlidersHorizontal size={18} />
                Personalizar
              </Button>
              <Button onClick={acceptAll} type="button">
                Aceitar todos
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {shouldShowModal ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/55 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
          <form
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-2xl"
            onSubmit={onSubmit}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase text-[var(--muted)]">LGPD</p>
                <h2 className="mt-1 text-2xl font-semibold">Preferencias de consentimento</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Voce pode mudar sua escolha a qualquer momento pela Politica de Cookies. Scripts opcionais so carregam apos o aceite.
                </p>
              </div>
              <button
                aria-label="Fechar preferencias"
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--line)]"
                onClick={close}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {categories.map((category) => (
                <label
                  className="flex cursor-pointer items-start justify-between gap-4 rounded-[8px] border border-[var(--line)] p-4"
                  key={category.key}
                >
                  <span>
                    <strong className="block">{category.label}</strong>
                    <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                      {category.description}
                    </span>
                  </span>
                  <input
                    checked={draft[category.key]}
                    className="mt-1 h-5 w-5 accent-[var(--accent)]"
                    disabled={category.locked}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [category.key]: event.target.checked,
                        necessary: true
                      }))
                    }
                    type="checkbox"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button onClick={rejectOptional} type="button" variant="ghost">
                Rejeitar opcionais
              </Button>
              <Button onClick={acceptAll} type="button" variant="secondary">
                Aceitar todos
              </Button>
              <Button type="submit">Salvar escolhas</Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
