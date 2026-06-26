"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/services/api";
import { resetPassword } from "@/services/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">Carregando...</section>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Este link de recuperacao esta incompleto. Solicite um novo e-mail.");
      return;
    }

    if (password !== confirmation) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await resetPassword({ token, password });
      setMessage(result.message);
      setPassword("");
      setConfirmation("");
    } catch (resetError) {
      setError(getApiErrorMessage(resetError, "Nao foi possivel redefinir sua senha."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <form className="w-full max-w-md rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-2xl shadow-black/10" noValidate onSubmit={onSubmit}>
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]" href="/login">
          <ArrowLeft size={16} />
          Voltar para entrar
        </Link>
        <span className="mt-7 flex h-12 w-12 items-center justify-center rounded-[8px] bg-[var(--accent)]/10 text-[var(--accent)]">
          <KeyRound size={22} />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">Crie uma nova senha</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Escolha uma senha com pelo menos 8 caracteres. Ao concluir, as sessoes abertas serao encerradas.</p>

        <div className="mt-6 space-y-4">
          <Input autoComplete="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Nova senha" required type="password" value={password} />
          <Input autoComplete="new-password" minLength={8} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirme a nova senha" required type="password" value={confirmation} />
          {error ? <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {message ? (
            <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <p>{message}</p>
              <Link className="mt-2 inline-block font-semibold underline" href="/login">
                Entrar agora
              </Link>
            </div>
          ) : null}
          <Button className="w-full" disabled={isSubmitting || Boolean(message)} type="submit">
            <KeyRound size={17} />
            {isSubmitting ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </div>
      </form>
    </section>
  );
}
