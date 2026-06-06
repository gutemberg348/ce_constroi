"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Building2, Crown, LogIn, User, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/services/auth";
import { getSafePostAuthPath } from "@/lib/navigation";
import { useAuthStore } from "@/stores/auth-store";

const demoLogins: Array<{
  label: string;
  email: string;
  password: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    label: "Admin",
    email: "admin@anselmo.dev",
    password: "Admin@123456",
    icon: Crown,
    tone: "bg-[#151714] text-white"
  },
  {
    label: "Arquiteto aprovado",
    email: "arquiteto@anselmo.dev",
    password: "Arq@123456",
    icon: Building2,
    tone: "bg-[var(--accent)] text-white"
  },
  {
    label: "Arquiteto pendente",
    email: "pendente@anselmo.dev",
    password: "Arq@123456",
    icon: UserCheck,
    tone: "bg-[var(--accent-3)] text-[#151714]"
  },
  {
    label: "Cliente",
    email: "cliente@anselmo.dev",
    password: "Cliente@123456",
    icon: User,
    tone: "bg-[var(--accent-2)] text-white"
  }
];

export default function LoginPage() {
  return (
    <Suspense fallback={<section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">Carregando login...</section>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const session = await login({ email, password });
      setSession(session);
      router.push(getSafePostAuthPath(searchParams.get("next")));
    } catch {
      setError("Email ou senha invalidos.");
    }
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase text-[var(--accent)]">Acesso</p>
        <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-tight">Entre no catálogo e siga pelo seu perfil.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
          Cliente, proprietario, arquiteto e admin usam a mesma base. Cada conta abre o que faz sentido para ela.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {demoLogins.map((item) => (
            <button
              className="focus-ring rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
              key={item.email}
              onClick={() => {
                setEmail(item.email);
                setPassword(item.password);
              }}
              type="button"
            >
              <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[8px] ${item.tone}`}>
                <item.icon size={19} />
              </span>
              <strong className="block">{item.label}</strong>
              <span className="mt-1 block text-sm text-[var(--muted)]">{item.email}</span>
              <span className="mt-1 block text-xs text-[var(--muted)]">{item.password}</span>
            </button>
          ))}
        </div>
      </div>
      <form className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-2xl shadow-black/10" onSubmit={onSubmit}>
        <div className="mb-6">
          <p className="text-sm uppercase text-[var(--muted)]">Login</p>
          <h2 className="mt-2 text-2xl font-semibold">Entrar</h2>
        </div>
        <div className="space-y-4">
          <Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="email@empresa.com" type="email" value={email} />
          <Input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" value={password} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" type="submit">
            <LogIn size={18} />
            Entrar
          </Button>
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Novo por aqui?{" "}
          <Link className="font-semibold text-[var(--accent)]" href="/register">
            Criar conta
          </Link>
        </p>
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          Ao acessar, voce concorda com os{" "}
          <Link className="font-semibold text-[var(--accent)]" href="/termos">
            Termos
          </Link>{" "}
          e reconhece a{" "}
          <Link className="font-semibold text-[var(--accent)]" href="/privacidade">
            Politica de Privacidade
          </Link>
          .
        </p>
      </form>
    </section>
  );
}
