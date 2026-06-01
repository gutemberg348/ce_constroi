# Arquitetura Geral

O sistema nasce como um monorepo com dois apps principais:

- `apps/api`: API NestJS modular, organizada por dominios de negocio.
- `apps/web`: frontend Next.js com App Router, SSR e camada de client state.

## Backend

Camadas:

- Controllers: entrada HTTP, Swagger, guards e DTOs.
- Services: casos de uso e regras de negocio.
- Repositories: acesso a dados via Prisma.
- Prisma: mapeamento relacional e transacoes.
- Common: guards, interceptors, filters, decorators, middleware e paginacao.

Modulos iniciais:

- auth
- users
- architects
- terrains
- terrain-images
- projects
- project-images
- compatibility
- simulations
- payments
- contracts
- favorites
- uploads
- notifications
- admin

## Frontend

Camadas:

- `app`: rotas, layouts e paginas SSR/client.
- `components`: UI reutilizavel e componentes por dominio.
- `services`: clientes HTTP com Axios.
- `hooks`: consultas com React Query.
- `stores`: estado local com Zustand.
- `types`: contratos compartilhados do frontend.
- `providers`: React Query, tema e composicao global.

## Fluxo principal

1. Usuario acessa terrenos ou projetos no frontend.
2. React Query busca dados na API usando Axios.
3. Controller valida DTOs e delega para service.
4. Service aplica regras e chama repository.
5. Repository consulta Prisma/PostgreSQL.
6. Resposta passa por interceptors, filtros e serializacao.
7. Checkout gera pedido, pagamento e contrato.
8. Webhooks atualizam pagamento, contrato e notificacoes.

## Decisoes iniciais

- Auth usa access token curto e refresh token rotativo.
- Soft delete usa `deletedAt` em entidades principais.
- Uploads guardam metadados no banco e enviam arquivo para storage externo.
- Pagamentos usam camada adapter para Stripe, Asaas e Mercado Pago.
- Redis fica reservado para cache, sessoes, rate limit e filas.
