import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso"
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase text-[var(--accent)]">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold">Termos de Uso</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Ultima atualizacao: 26 de maio de 2026.</p>

      <div className="mt-8 space-y-8 leading-7 text-[var(--muted)]">
        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">1. Plataforma</h2>
          <p className="mt-3">
            A Cê constroi conecta clientes, proprietarios de terrenos, arquitetos e administradores para consulta,
            simulacao e compra de terrenos, projetos arquitetonicos e pacotes combinados.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">2. Contas e perfis</h2>
          <p className="mt-3">
            O usuario deve fornecer informacoes verdadeiras e manter suas credenciais em sigilo. Contas de arquiteto passam
            por curadoria administrativa antes de publicar projetos ou receber vendas.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">3. Arquitetos</h2>
          <p className="mt-3">
            O arquiteto declara possuir capacidade tecnica e regularidade profissional para publicar projetos. A aprovacao
            administrativa pode ser suspensa ou recusada quando houver inconsistencias cadastrais, documentais ou operacionais.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">4. Terrenos e projetos</h2>
          <p className="mt-3">
            Informacoes de preco, metragem, disponibilidade, estimativa de obra e simulacao financeira podem depender de
            validacoes tecnicas, comerciais e documentais. Antes de uma compra real, documentos, contratos e dados tecnicos
            devem ser conferidos pelas partes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">5. Pagamentos e contratos</h2>
          <p className="mt-3">
            A plataforma esta preparada para checkout com split de pagamento, contratos e webhooks. Em ambiente de producao,
            regras finais de pagamento, cancelamento, repasse e reembolso deverao constar no contrato e nas politicas
            comerciais aplicaveis.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">6. Uso adequado</h2>
          <p className="mt-3">
            E proibido usar a plataforma para fraude, engenharia reversa, publicacao de conteudo falso, violacao de direitos
            autorais, tentativa de invasao, automacao abusiva ou qualquer finalidade ilegal.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">7. Privacidade</h2>
          <p className="mt-3">
            O tratamento de dados pessoais segue a Politica de Privacidade e a Politica de Cookies. Recursos opcionais ficam
            bloqueados ate o consentimento do usuario.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">8. Contato</h2>
          <p className="mt-3">
            Para suporte, privacidade ou solicitacoes relacionadas a dados pessoais, use o canal: privacidade@ceconstroi.dev.
          </p>
        </section>
      </div>
    </section>
  );
}
