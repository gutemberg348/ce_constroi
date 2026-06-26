"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";
import { Camera, CheckCircle2, Home, LogIn, Plus, Search, ShieldCheck, UploadCloud, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { readFileAsDataUrl } from "@/lib/files";
import { toNumber } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import { getCondominiums } from "@/services/condominiums";
import { getSiteSettings } from "@/services/settings";
import { createTerrain } from "@/services/terrains";
import { createTerrainImage } from "@/services/terrain-images";
import { useAuthStore } from "@/stores/auth-store";

type AnnouncementForm = {
  announcerType: "Proprietario" | "Corretor";
  creci: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  state: string;
  city: string;
  propertyType: string;
  destination: string;
  situation: string;
  intention: string;
  developmentType: "OPEN" | "CLOSED";
  condominiumId: string;
  expectedValue: string;
  iptuValue: string;
  condominiumValue: string;
  totalArea: string;
  frontageM: string;
  depthM: string;
  usefulArea: string;
  features: string;
};

const initialForm: AnnouncementForm = {
  announcerType: "Proprietario",
  creci: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  state: "",
  city: "",
  propertyType: "Terreno",
  destination: "Residencial",
  situation: "Liberado para construcao",
  intention: "Venda",
  developmentType: "OPEN",
  condominiumId: "",
  expectedValue: "",
  iptuValue: "",
  condominiumValue: "",
  totalArea: "",
  frontageM: "",
  depthM: "",
  usefulArea: "",
  features: ""
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function inputClass() {
  return "focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none transition";
}

function textAreaClass() {
  return "focus-ring min-h-32 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 py-3 text-sm outline-none placeholder:text-[var(--muted)]";
}

export default function AnnounceTerrainPage() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const settingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings
  });
  const condominiumsQuery = useQuery({
    queryKey: ["condominiums", "announce"],
    queryFn: () => getCondominiums({ limit: 100 })
  });
  const [form, setForm] = useState<AnnouncementForm>(initialForm);
  const [photoSlots, setPhotoSlots] = useState([0, 1, 2, 3]);
  const [photos, setPhotos] = useState<Array<File | null>>([null, null, null, null]);
  const [cepMessage, setCepMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAnnounce = Boolean(accessToken && (user?.role === "TERRAIN_OWNER" || user?.role === "ADMIN"));
  const selectedPhotoCount = photos.filter(Boolean).length;
  const condominiums = condominiumsQuery.data?.items ?? [];

  const ownerName = form.ownerName || user?.name || "";
  const ownerEmail = form.ownerEmail || user?.email || "";
  const effectiveCreci = form.creci.trim() || settingsQuery.data?.defaultCreci?.trim() || "";

  const title = useMemo(() => {
    const place = form.neighborhood || form.city || "novo anuncio";
    return `Terreno em ${place}`;
  }, [form.city, form.neighborhood]);

  function update<Key extends keyof AnnouncementForm>(key: Key, value: AnnouncementForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function consultCep() {
    const cep = onlyDigits(form.cep);
    setCepMessage("");

    if (cep.length !== 8) {
      setCepMessage("Informe um CEP com 8 digitos.");
      return;
    }

    setIsCepLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      if (data.erro) {
        setCepMessage("CEP nao encontrado.");
        return;
      }

      setForm((current) => ({
        ...current,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
        city: data.localidade || current.city,
        state: data.uf || current.state
      }));
      setCepMessage("Endereco preenchido.");
    } catch {
      setCepMessage("Nao foi possivel consultar o CEP agora.");
    } finally {
      setIsCepLoading(false);
    }
  }

  function addPhotoSlot() {
    setPhotoSlots((current) => [...current, current.length]);
    setPhotos((current) => [...current, null]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!canAnnounce) {
      setError("Entre como proprietario ou corretor para anunciar.");
      return;
    }

    if (!effectiveCreci) {
      setError("Informe o CRECI do responsável ou peça ao administrador para cadastrar o CRECI padrão da empresa.");
      return;
    }

    if (selectedPhotoCount < 3) {
      setError("Selecione pelo menos 3 fotos do terreno.");
      return;
    }

    const areaM2 = toNumber(form.totalArea);
    const frontageM = toNumber(form.frontageM);
    const depthM = toNumber(form.depthM);
    const price = toNumber(form.expectedValue);
    const iptuValue = toNumber(form.iptuValue);
    const condominiumValue = toNumber(form.condominiumValue);

    if (!areaM2 || !frontageM || !depthM || !price) {
      setError("Informe area total, frente, fundo e valor aproximado.");
      return;
    }

    setIsSubmitting(true);

    try {
      const terrain = await createTerrain({
        title,
        description: [
          form.features,
          `Tipo: ${form.propertyType}`,
          `Destino: ${form.destination}`,
          `Situacao: ${form.situation}`,
          `Pretensao: ${form.intention}`,
          `Area total: ${areaM2} m2`,
          `Frente: ${frontageM} m`,
          `Fundo: ${depthM} m`
        ]
          .filter(Boolean)
          .join("\n"),
        address: `${form.street}, ${form.number}${form.complement ? ` - ${form.complement}` : ""}`,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        zipCode: onlyDigits(form.cep),
        condominiumId: form.condominiumId || undefined,
        areaM2,
        frontageM,
        depthM,
        price,
        zoning: `Terreno - ${form.intention}`,
        metadata: {
          source: "owner_announcement",
          owner: {
            type: form.announcerType,
            creci: effectiveCreci,
            creciSource: form.creci.trim() ? "announcer" : "company_default",
            name: ownerName,
            phone: form.ownerPhone,
            email: ownerEmail
          },
          property: {
            street: form.street,
            number: form.number,
            complement: form.complement,
            propertyType: form.propertyType,
            destination: form.destination,
            situation: form.situation,
            intention: form.intention,
            developmentType: form.developmentType,
            totalArea: areaM2,
            frontageM,
            depthM,
            iptuValue: iptuValue || undefined,
            condominiumValue: condominiumValue || undefined,
            usefulArea: toNumber(form.usefulArea),
            features: form.features
          },
          photos: photos.flatMap((photo) => (photo ? [{ name: photo.name, type: photo.type, size: photo.size }] : []))
        }
      });

      await Promise.all(
        photos
          .map((photo, index) => ({ photo, index }))
          .filter(({ photo }) => Boolean(photo))
          .map(async ({ photo, index }) => {
            const file = photo as File;
            await createTerrainImage({
              terrainId: terrain.id,
              url: await readFileAsDataUrl(file),
              altText: file.name,
              sortOrder: index,
              isCover: index === 0
            });
          })
      );

      setForm(initialForm);
      setPhotoSlots([0, 1, 2, 3]);
      setPhotos([null, null, null, null]);
      setCepMessage("");
      if (event.currentTarget) {
        event.currentTarget.reset();
      }

      setSuccess(`Anuncio enviado para analise. Protocolo: ${terrain.id}`);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Não foi possível enviar o anúncio agora."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canAnnounce) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--accent)]">Anuncie seu terreno</p>
            <h1 className="mt-3 text-4xl font-semibold">Anuncie seu terreno conosco!</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
              Cadastre com total seguranca. Para enviar seu anuncio, use uma conta de Proprietario ou Corretor.
            </p>
            {accessToken ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                Voce esta logado como {user?.role}. Entre com uma conta de Proprietario ou Corretor para anunciar.
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:min-w-72 md:grid-cols-1">
            <Link href="/login?next=/anunciar-terreno">
              <Button className="w-full" type="button">
                <LogIn size={18} />
                Entrar
              </Button>
            </Link>
            <Link href="/register?role=TERRAIN_OWNER&next=/anunciar-terreno">
              <Button className="w-full" type="button" variant="secondary">
                <UserRound size={18} />
                Cadastrar proprietario/corretor
              </Button>
            </Link>
            {accessToken ? (
              <Button className="w-full" onClick={logout} type="button" variant="ghost">
                Sair da conta atual
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--accent)]">Anunciar</p>
          <h1 className="mt-2 text-4xl font-semibold">Anuncie seu terreno conosco!</h1>
          <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
            Cadastre com total seguranca. O anuncio entra em analise antes de aparecer no marketplace.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold">
          <ShieldCheck className="text-[var(--accent)]" size={18} />
          Proprietario verificado
        </div>
      </div>

      <form className="grid gap-6 lg:grid-cols-[1fr_340px]" noValidate onSubmit={onSubmit}>
        <div className="space-y-6">
          <fieldset className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
            <legend className="px-1 text-lg font-semibold">1. Responsavel pelo anuncio</legend>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <select className={inputClass()} onChange={(event) => update("announcerType", event.target.value as AnnouncementForm["announcerType"])} value={form.announcerType}>
                <option>Proprietario</option>
                <option>Corretor</option>
              </select>
              <Input onChange={(event) => update("ownerName", event.target.value)} placeholder={user?.name ?? "Nome completo"} required value={form.ownerName} />
              <Input onChange={(event) => update("ownerPhone", event.target.value)} placeholder="Telefone / WhatsApp" required value={form.ownerPhone} />
              <Input onChange={(event) => update("ownerEmail", event.target.value)} placeholder={user?.email ?? "E-mail"} required type="email" value={form.ownerEmail} />
              {form.announcerType === "Corretor" ? (
                <div className="md:col-span-4">
                  <Input
                    onChange={(event) => update("creci", event.target.value)}
                    placeholder="CRECI do corretor (opcional se houver padrão da empresa)"
                    value={form.creci}
                  />
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Se ficar vazio, será utilizado o CRECI padrão cadastrado pelo administrador.
                  </p>
                </div>
              ) : (
                <p className="md:col-span-4 text-sm text-[var(--muted)]">
                  CRECI responsável: {settingsQuery.data?.defaultCreci || "aguardando configuração do administrador"}
                </p>
              )}
            </div>
          </fieldset>

          <fieldset className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
          <legend className="px-1 text-lg font-semibold">2. Terreno</legend>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <Input inputMode="numeric" onChange={(event) => update("cep", event.target.value)} placeholder="CEP" required value={form.cep} />
                  <Button disabled={isCepLoading} onClick={consultCep} type="button" variant="secondary">
                    <Search size={17} />
                    CEP
                  </Button>
                </div>
                {cepMessage ? <p className="mt-2 text-xs text-[var(--muted)]">{cepMessage}</p> : null}
              </div>
              <Input className="md:col-span-2" onChange={(event) => update("street", event.target.value)} placeholder="Rua / Av" required value={form.street} />
              <Input onChange={(event) => update("number", event.target.value)} placeholder="Numero" required value={form.number} />
              <Input onChange={(event) => update("complement", event.target.value)} placeholder="Complemento" value={form.complement} />
              <Input onChange={(event) => update("neighborhood", event.target.value)} placeholder="Bairro" required value={form.neighborhood} />
              <Input onChange={(event) => update("state", event.target.value.toUpperCase())} placeholder="Estado" required value={form.state} />
              <Input className="md:col-span-2" onChange={(event) => update("city", event.target.value)} placeholder="Cidade" required value={form.city} />
              <select className={inputClass()} onChange={(event) => update("propertyType", event.target.value)} value={form.propertyType}>
                <option>Area</option>
                <option>Chacara</option>
                <option>Lote</option>
                <option>Lote em condominio</option>
                <option>Terreno</option>
                <option>Terreno em condominio</option>
              </select>
              <select className={inputClass()} onChange={(event) => update("destination", event.target.value)} value={form.destination}>
                <option>Residencial</option>
                <option>Comercial</option>
              </select>
              <select className={inputClass()} onChange={(event) => update("situation", event.target.value)} value={form.situation}>
                <option>Breve lancamento</option>
                <option>Lancamento</option>
                <option>Liberado para construcao</option>
              </select>
              <select className={inputClass()} onChange={(event) => update("intention", event.target.value)} value={form.intention}>
                <option>Venda</option>
                <option>Venda ou permuta</option>
                <option>Parceria</option>
              </select>
              <select
                className={inputClass()}
                onChange={(event) => update("developmentType", event.target.value as AnnouncementForm["developmentType"])}
                value={form.developmentType}
              >
                <option value="OPEN">Local aberto</option>
                <option value="CLOSED">Condomínio ou loteamento fechado</option>
              </select>
              <select className={`${inputClass()} md:col-span-2`} onChange={(event) => update("condominiumId", event.target.value)} value={form.condominiumId}>
                <option value="">Nao vincular a condominio</option>
                {condominiums.map((condominium) => (
                  <option key={condominium.id} value={condominium.id}>
                    {condominium.name} - {[condominium.neighborhood, condominium.city, condominium.state].filter(Boolean).join(", ")}
                  </option>
                ))}
              </select>
              <CurrencyInput onValueChange={(value) => update("expectedValue", value)} placeholder="Valor aproximado" required value={form.expectedValue} />
              <CurrencyInput onValueChange={(value) => update("iptuValue", value)} placeholder="IPTU (opcional)" value={form.iptuValue} />
              <CurrencyInput onValueChange={(value) => update("condominiumValue", value)} placeholder="Condominio (opcional)" value={form.condominiumValue} />
              <Input inputMode="decimal" onChange={(event) => update("totalArea", event.target.value)} placeholder="Area total do terreno (m2)" required value={form.totalArea} />
              <Input inputMode="decimal" onChange={(event) => update("frontageM", event.target.value)} placeholder="Frente do terreno (m)" required value={form.frontageM} />
              <Input inputMode="decimal" onChange={(event) => update("depthM", event.target.value)} placeholder="Fundo do terreno (m)" required value={form.depthM} />
              <Input inputMode="decimal" onChange={(event) => update("usefulArea", event.target.value)} placeholder="Area de aproveitamento" value={form.usefulArea} />
              <textarea
                className={`${textAreaClass()} md:col-span-4`}
                onChange={(event) => update("features", event.target.value)}
                placeholder="Descreva as caracteristicas do terreno"
                required
                value={form.features}
              />
            </div>
          </fieldset>

          <fieldset className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
            <legend className="px-1 text-lg font-semibold">3. Fotos do terreno</legend>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {photoSlots.map((slot, index) => (
                <label className="rounded-[8px] border border-dashed border-[var(--line)] p-3 text-sm" key={slot}>
                  <span className="mb-2 flex items-center gap-2 font-semibold">
                    <Camera size={16} />
                    Foto {index + 1}
                  </span>
                  <input
                    accept="image/*"
                    className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#061733] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:file:bg-white dark:file:text-[#061733]"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setPhotos((current) => {
                        const next = [...current];
                        next[index] = file;
                        return next;
                      });
                    }}
                    required={index < 3}
                    type="file"
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button disabled={photoSlots.length >= 10} onClick={addPhotoSlot} type="button" variant="ghost">
                <Plus size={18} />
                Adicionar mais fotos
              </Button>
              <span className="text-sm text-[var(--muted)]">{selectedPhotoCount} foto(s) selecionada(s). Minimo 3.</span>
            </div>
          </fieldset>

        </div>

        <aside className="h-fit rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5 lg:sticky lg:top-24">
          <Home className="text-[var(--accent)]" size={26} />
          <h2 className="mt-4 text-2xl font-semibold">Resumo do anuncio</h2>
            <div className="mt-5 space-y-3 text-sm text-[var(--muted)]">
              <p>
                <strong className="text-[var(--foreground)]">{title}</strong>
              </p>
              <p>
                {form.neighborhood || "Bairro"} - {form.city || "Cidade"} / {form.state || "UF"}
              </p>
              <p>{form.totalArea || "0"} m2 de area total</p>
              <p>
                Frente {form.frontageM || "0"} m / Fundo {form.depthM || "0"} m
              </p>
              <p>
                {form.propertyType} - {form.destination}
              </p>
              <p>{form.situation}</p>
              {form.iptuValue || form.condominiumValue ? (
                <p>
                  {form.iptuValue ? `IPTU ${form.iptuValue}` : ""}
                  {form.iptuValue && form.condominiumValue ? " / " : ""}
                  {form.condominiumValue ? `Condominio ${form.condominiumValue}` : ""}
                </p>
              ) : null}
              <p>{form.developmentType === "CLOSED" ? "Local fechado" : "Local aberto"}</p>
              <p>{selectedPhotoCount} foto(s) anexada(s)</p>
              <p>
                Responsavel: {form.announcerType}
                {effectiveCreci ? ` - CRECI ${effectiveCreci}` : ""}
              </p>
            </div>

          {error ? <p className="mt-5 rounded-[8px] bg-red-500/10 p-3 text-sm text-red-600">{error}</p> : null}
          {success ? (
            <p className="mt-5 flex gap-2 rounded-[8px] bg-emerald-500/10 p-3 text-sm text-emerald-700">
              <CheckCircle2 className="shrink-0" size={18} />
              {success}
            </p>
          ) : null}

          <Button className="mt-5 w-full" disabled={isSubmitting} type="submit" variant="secondary">
            <UploadCloud size={18} />
            {isSubmitting ? "Enviando..." : "Anunciar"}
          </Button>
        </aside>
      </form>
    </section>
  );
}
