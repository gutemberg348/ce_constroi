import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de Privacidade"
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase text-[var(--accent)]">LGPD</p>
      <h1 className="mt-3 text-4xl font-semibold">Politica de Privacidade</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Ultima atualizacao: 26 de maio de 2026.</p>

      <div className="mt-8 space-y-8 leading-7 text-[var(--muted)]">
        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">1. Dados coletados</h2>
          <p className="mt-3">
            Podemos tratar dados cadastrais, dados de contato, credenciais protegidas, perfil de uso, favoritos, simulacoes,
            pedidos, contratos, dados de pagamento, imagens enviadas e comunicacoes feitas dentro da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">2. Finalidades</h2>
          <p className="mt-3">
            Usamos dados para criar contas, autenticar usuarios, operar o marketplace, aprovar arquitetos, vincular terrenos
            e projetos, calcular simulacoes, processar pedidos, prevenir fraude, prestar suporte e cumprir obrigacoes legais.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">3. Bases legais</h2>
          <p className="mt-3">
            O tratamento pode ocorrer para execucao de contrato, cumprimento de obrigacao legal, exercicio regular de direitos,
            legitimo interesse, prevencao a fraude e consentimento quando exigido, especialmente para cookies e recursos
            opcionais.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">4. Compartilhamento</h2>
          <p className="mt-3">
            Dados podem ser compartilhados com provedores de hospedagem, banco de dados, storage, pagamentos, assinatura de
            contratos, antifraude, analytics consentido e parceiros necessarios para executar a compra ou prestacao do servico.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">5. Direitos do titular</h2>
          <p className="mt-3">
            Voce pode solicitar confirmacao de tratamento, acesso, correcao, anonimizacao, bloqueio, eliminacao, portabilidade,
            informacoes sobre compartilhamento, revisao de decisoes e revogacao do consentimento, conforme aplicavel.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">6. Retencao</h2>
          <p className="mt-3">
            Guardamos dados pelo tempo necessario para operar a conta, cumprir contratos, preservar historico de pedidos,
            atender obrigacoes legais, prevenir fraude e exercer direitos em processos administrativos, judiciais ou arbitrais.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">7. Seguranca</h2>
          <p className="mt-3">
            A plataforma usa criptografia de senhas, tokens de autenticacao, controles de acesso por papel, validacao de dados,
            logs tecnicos, rate limiting e separacao de permissoes para reduzir riscos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">8. Encarregado</h2>
          <p className="mt-3">
            Para exercer direitos ou tirar duvidas sobre privacidade, envie mensagem para privacidade@ceconstroi.dev.
          </p>
        </section>
      </div>
    </section>
  );
}
