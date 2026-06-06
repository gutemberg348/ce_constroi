import type { Metadata } from "next";
import { CookiePreferencesButton } from "@/components/privacy/cookie-preferences-button";

export const metadata: Metadata = {
  title: "Politica de Cookies"
};

export default function CookiesPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase text-[var(--accent)]">LGPD</p>
      <h1 className="mt-3 text-4xl font-semibold">Politica de Cookies</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Ultima atualizacao: 26 de maio de 2026.</p>

      <div className="mt-6 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
        <p className="leading-7 text-[var(--muted)]">
          A plataforma mantem analytics, marketing e recursos opcionais desligados por padrao. Imagens essenciais de catalogo
          e banners podem carregar para manter a experiencia visual do marketplace.
        </p>
        <CookiePreferencesButton className="mt-4" />
      </div>

      <div className="mt-8 space-y-8 leading-7 text-[var(--muted)]">
        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">1. Necessarios</h2>
          <p className="mt-3">
            Essenciais para seguranca, autenticacao, prevencao de abuso, registro da sua escolha de privacidade e operacao
            basica. Nao podem ser desativados pela interface.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">2. Preferencias</h2>
          <p className="mt-3">
            Guardam escolhas de interface e experiencia, como tema ou preferencias de navegacao. Permanecem desligados ate
            autorizacao.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">3. Midia opcional</h2>
          <p className="mt-3">
            Libera recursos externos que nao sejam essenciais para a navegacao basica. Banners e imagens de catalogo podem ser
            exibidos sem esconder a interface principal do usuario.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">4. Analytics</h2>
          <p className="mt-3">
            Reservado para metricas agregadas de uso, desempenho e melhoria do produto. Nenhum script de analytics esta ativo
            antes do consentimento.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">5. Marketing</h2>
          <p className="mt-3">
            Reservado para campanhas, pixels e remarketing. Fica desligado por padrao e so deve ser ativado com consentimento
            explicito.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">6. Como mudar sua escolha</h2>
          <p className="mt-3">
            Use o botao &quot;Gerenciar cookies&quot; nesta pagina ou no rodape do site para abrir as preferencias e alterar o seu
            consentimento.
          </p>
        </section>
      </div>
    </section>
  );
}
