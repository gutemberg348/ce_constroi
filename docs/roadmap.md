# Roadmap

## Fase 1 - Fundacao

- Monorepo, Docker, Prisma schema e configuracao de ambiente.
- Auth JWT com refresh token, roles e guards.
- CRUD inicial de terrenos, projetos, imagens, favoritos e simulacoes.
- Frontend com home, listagens, detalhes, login, registro e dashboards base.

## Fase 2 - Marketplace real

- Upload real para S3/R2 com presigned URLs.
- Busca avancada com filtros geograficos e atributos tecnicos.
- Compatibilidade automatica por metragem, recuos, dimensoes e regras locais.
- SEO por pagina de terreno e projeto.

## Fase 3 - Checkout

- Pedidos, pagamentos, split e webhooks.
- Integracao inicial com Stripe, seguida de Asaas e Mercado Pago.
- Contratos gerados a partir dos pedidos pagos.
- Notificacoes transacionais.

## Fase 4 - Operacao

- Admin analytics, moderacao e auditoria.
- Painel de arquiteto com funil de vendas e estatisticas.
- Cache Redis, filas, rate limiting distribuido e observabilidade.
- Testes e2e, CI/CD e hardening de seguranca.
