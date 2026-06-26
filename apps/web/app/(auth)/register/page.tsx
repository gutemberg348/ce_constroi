"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getSafePostAuthPath } from "@/lib/navigation";
import { getApiErrorMessage } from "@/services/api";
import { register, type RegisterInput } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";
import { UserRole } from "@/types/domain";

function getInitialRole(value: string | null): UserRole {
  if (value === "TERRAIN_OWNER" || value === "CUSTOMER") {
    return value;
  }

  return "CUSTOMER";
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">Carregando cadastro...</section>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [role, setRole] = useState<UserRole>(() => getInitialRole(searchParams.get("role")));
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");

  function maskPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) {
      return digits ? `(${digits}` : "";
    }

    if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const companyName = String(formData.get("companyName") ?? "").trim();
    const cauNumber = String(formData.get("cauNumber") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();

    try {
      const input: RegisterInput = {
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        password: String(formData.get("password")),
        role,
        phone: String(formData.get("phone"))
      };

      if (role === "ARCHITECT") {
        input.companyName = companyName;
        input.cauNumber = cauNumber;
        input.bio = bio;
      }

      const session = await register(input);
      setSession(session);
      router.push(getSafePostAuthPath(searchParams.get("next")));
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Não foi possível criar a conta."));
    }
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div>
        <p className="text-sm uppercase text-[var(--muted)]">Cadastro</p>
        <h1 className="mt-3 text-4xl font-semibold">Crie sua conta para acessar o catálogo e anunciar terreno.</h1>
        <p className="mt-4 max-w-xl text-[var(--muted)]">
          Aqui entram cliente e proprietario. Arquitetos sao criados pelo admin e aprovados antes de publicar projetos.
        </p>
      </div>
      <form className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6" noValidate onSubmit={onSubmit}>
        <div className="space-y-4">
          <Input name="name" placeholder="Nome completo" required />
          <Input autoComplete="email" name="email" placeholder="email@empresa.com" required type="email" />
          <Input
            autoComplete="tel"
            inputMode="tel"
            name="phone"
            onChange={(event) => setPhone(maskPhone(event.target.value))}
            placeholder="(11) 99999-9999"
            required
            value={phone}
          />
          <PasswordInput autoComplete="new-password" minLength={8} name="password" placeholder="Senha" required />
          <div className="grid grid-cols-3 gap-2">
            {[
              ["CUSTOMER", "Cliente"],
              ["TERRAIN_OWNER", "Proprietario"]
            ].map(([value, label]) => (
              <button
                className={`focus-ring h-11 rounded-[8px] border text-sm font-semibold ${
                  role === value
                    ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]"
                    : "border-[var(--line)] text-[var(--muted)]"
                }`}
                key={value}
                onClick={() => setRole(value as UserRole)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_4%,var(--panel))] p-4 text-sm text-[var(--muted)]">
            Arquitetos sao criados pelo admin. Aqui o cadastro fica para cliente e proprietario.
          </div>
          <label className="flex items-start gap-3 rounded-[8px] border border-[var(--line)] p-3 text-sm leading-6 text-[var(--muted)]">
            <input className="mt-1 h-4 w-4 accent-[var(--accent)]" required type="checkbox" />
            <span>
              Li e concordo com os{" "}
              <Link className="font-semibold text-[var(--accent)]" href="/termos">
                Termos de Uso
              </Link>
              , a{" "}
              <Link className="font-semibold text-[var(--accent)]" href="/privacidade">
                Politica de Privacidade
              </Link>{" "}
              e a{" "}
              <Link className="font-semibold text-[var(--accent)]" href="/cookies">
                Politica de Cookies
              </Link>
              .
            </span>
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" type="submit" variant="secondary">
            <UserPlus size={18} />
            Criar conta
          </Button>
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Ja tem conta?{" "}
          <Link className="font-semibold text-[var(--accent)]" href="/login">
            Entrar
          </Link>
        </p>
      </form>
    </section>
  );
}
