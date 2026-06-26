"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/services/api";
import { requestPasswordReset } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Nao foi possivel solicitar a troca de senha."));
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
          <Mail size={22} />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">Recupere sua senha</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Informe o e-mail da sua conta. Enviaremos um link seguro para criar uma nova senha.</p>

        <div className="mt-6 space-y-4">
          <Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="seuemail@exemplo.com" required type="email" value={email} />
          {error ? <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            <Send size={17} />
            {isSubmitting ? "Enviando..." : "Enviar link de recuperacao"}
          </Button>
        </div>
      </form>
    </section>
  );
}
