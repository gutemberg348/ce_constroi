# Guia completo do projeto

Este documento explica o que existe no projeto, para que serve cada parte e como rodar tudo do zero.

## Visao geral

O projeto e um marketplace SaaS para arquitetura e terrenos.

Ele permite evoluir para uma plataforma onde:

- clientes veem terrenos e projetos arquitetonicos;
- arquitetos publicam projetos;
- terrenos podem ser vinculados a projetos compativeis;
- clientes simulam terreno + projeto + obra;
- clientes compram terreno, projeto ou pacote completo;
- pagamentos ficam preparados para split;
- existem paineis para cliente, arquiteto e admin.

## Stack

Frontend:

- Next.js App Router
- React
- TypeScript
- TailwindCSS
- React Query
- Axios
- Zustand

Backend:

- NestJS
- TypeScript
- Prisma ORM
- JWT Auth
- Swagger
- Guards, DTOs, services, repositories, interceptors e filters

Banco e infra:

- PostgreSQL
- Redis
- Docker
- Docker Compose

Uploads e pagamentos:

- estrutura preparada para S3 ou Cloudflare R2
- estrutura preparada para Stripe, Asaas e Mercado Pago

## Estrutura principal

```txt
.
├── apps
│   ├── api
│   │   ├── prisma
│   │   │   └── schema.prisma
│   │   └── src
│   │       ├── common
│   │       ├── config
│   │       ├── database
│   │       └── modules
│   └── web
│       ├── app
│       ├── components
│       ├── hooks
│       ├── layouts
│       ├── providers
│       ├── services
│       ├── stores
│       └── types
├── docs
├── docker-compose.yml
├── package.json
└── .env.example
```

## Apps do monorepo

## Documentos principais

```txt
docs/guia_completo.md
docs/fluxo.md
docs/simulacao.md
docs/arquitetura.md
docs/api-flows.md
docs/roadmap.md
```

### API

Fica em:

```txt
apps/api
```

Responsabilidades:

- autenticar usuarios;
- validar permissoes por role;
- expor endpoints REST;
- acessar PostgreSQL via Prisma;
- documentar API via Swagger;
- preparar pagamentos, contratos, favoritos, notificacoes e uploads.

Modulos criados:

```txt
auth
users
architects
terrains
terrain-images
projects
project-images
compatibility
simulations
payments
contracts
favorites
uploads
notifications
admin
```

### Web

Fica em:

```txt
apps/web
```

Responsabilidades:

- exibir home;
- listar terrenos;
- listar projetos;
- mostrar detalhes;
- login e cadastro;
- dashboard do cliente;
- painel do arquiteto;
- painel admin;
- favoritos;
- checkout;
- simulacao financeira.

## Requisitos para rodar

Use:

- Node.js `22.12+`
- npm `10+`
- Docker Desktop com engine ligado

Para conferir:

```bash
node -v
npm -v
docker --version
```

Se seu Node for `18.x`, o projeto nao vai rodar corretamente. Prisma 7, Next 16 e Nest 11 exigem Node mais novo.

## Arquivos de ambiente

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, se `cp` nao funcionar:

```powershell
Copy-Item .env.example .env
```

### Quando rodar tudo pelo Docker

Mantenha:

```env
DATABASE_URL=postgresql://anselmo:anselmo_dev_password@postgres:5432/anselmo_marketplace?schema=public
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
NEXT_PUBLIC_API_URL=http://localhost:3333/api/v1
```

Dentro do Docker, o host do banco e `postgres`, porque esse e o nome do service no `docker-compose.yml`.

### Quando rodar API e Web localmente

Se a API estiver rodando fora do Docker, mas Postgres e Redis estiverem no Docker, altere no `.env`:

```env
DATABASE_URL=postgresql://anselmo:anselmo_dev_password@localhost:5432/anselmo_marketplace?schema=public
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
NEXT_PUBLIC_API_URL=http://localhost:3333/api/v1
```

Fora do Docker, o host correto e `localhost`.

## Instalacao

Na raiz do projeto:

```bash
npm install
```

Depois gere o Prisma Client:

```bash
npm run prisma:generate
```

## Rodar tudo localmente

Este modo roda Postgres e Redis no Docker, mas API e Web direto no Node.

1. Suba banco e Redis:

```bash
docker compose up -d postgres redis
```

2. Ajuste o `.env` para usar `localhost` no banco e no Redis:

```env
DATABASE_URL=postgresql://anselmo:anselmo_dev_password@localhost:5432/anselmo_marketplace?schema=public
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
```

3. Instale dependencias:

```bash
npm install
```

4. Gere o Prisma Client:

```bash
npm run prisma:generate
```

5. Crie a primeira migration:

```bash
npm run prisma:migrate -w @anselmo/api -- --name init
```

6. Rode API e Web juntos:

```bash
npm run dev
```

URLs:

```txt
Web:     http://localhost:3000
API:     http://localhost:3333/api/v1
Swagger: http://localhost:3333/docs
```

## Logins de teste

Depois de rodar o seed, use:

```txt
Admin
Email: admin@anselmo.dev
Senha: Admin@123456
URL:   http://localhost:3000/admin

Arquiteto aprovado
Email: arquiteto@anselmo.dev
Senha: Arq@123456
URL:   http://localhost:3000/painel-arquiteto

Arquiteto pendente
Email: pendente@anselmo.dev
Senha: Arq@123456
URL:   http://localhost:3000/painel-arquiteto

Cliente
Email: cliente@anselmo.dev
Senha: Cliente@123456
URL:   http://localhost:3000/dashboard
```

O arquiteto pendente precisa ser aprovado em:

```txt
http://localhost:3000/admin
```

Fluxo recomendado:

1. Entre como `pendente@anselmo.dev`.
2. Veja o painel do arquiteto bloqueado aguardando aprovacao.
3. Entre como `admin@anselmo.dev`.
4. Aprove o arquiteto na fila de curadoria.
5. Entre novamente como arquiteto pendente e veja o perfil aprovado.

## Rodar somente a API

```bash
npm run dev:api
```

API:

```txt
http://localhost:3333/api/v1
```

Swagger:

```txt
http://localhost:3333/docs
```

## Rodar somente o frontend

```bash
npm run dev:web
```

Web:

```txt
http://localhost:3000
```

## Rodar tudo com Docker

Este modo sobe Postgres, Redis, API e Web em containers.

Para nao misturar com outros projetos Docker da maquina, use sempre o nome de projeto:

```bash
docker compose -p projeto_anselmo ...
```

1. Garanta que o Docker Desktop esteja aberto.

2. Use `.env` com host `postgres`:

```env
DATABASE_URL=postgresql://anselmo:anselmo_dev_password@postgres:5432/anselmo_marketplace?schema=public
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
```

3. Suba Postgres e Redis primeiro:

```bash
docker compose -p projeto_anselmo up -d postgres redis
```

4. Rode a migration dentro do container da API:

```bash
docker compose -p projeto_anselmo run --rm api npm run prisma:migrate -- --name init
```

5. Suba tudo:

```bash
docker compose -p projeto_anselmo up --build
```

URLs:

```txt
Web:     http://localhost:3000
API:     http://localhost:3333/api/v1
Swagger: http://localhost:3333/docs
Postgres: localhost:5432
Redis:    localhost:6379
```

Para parar:

```bash
docker compose -p projeto_anselmo down
```

Para parar e apagar os volumes do banco:

```bash
docker compose -p projeto_anselmo down -v
```

Atencao: `docker compose down -v` apaga os dados do banco local.

## Prisma

Schema principal:

```txt
apps/api/prisma/schema.prisma
```

Gerar client:

```bash
npm run prisma:generate
```

Rodar seed:

```bash
npm run prisma:seed -w @anselmo/api
```

Rodar seed pelo Docker:

```bash
docker compose -p projeto_anselmo run --rm api npm run prisma:seed
```

## URLs principais para testar

```txt
Home:              http://localhost:3000
Login demo:        http://localhost:3000/login
Admin:             http://localhost:3000/admin
Painel arquiteto:  http://localhost:3000/painel-arquiteto
Dashboard cliente: http://localhost:3000/dashboard
Terrenos:          http://localhost:3000/terrenos
Projetos:          http://localhost:3000/projetos
Simulacao:         http://localhost:3000/simulacao
Checkout:          http://localhost:3000/checkout
API:               http://localhost:3333/api/v1
Swagger:           http://localhost:3333/docs
```

Criar migration:

```bash
npm run prisma:migrate -w @anselmo/api -- --name nome_da_migration
```

Abrir Prisma Studio:

```bash
npm run prisma:studio -w @anselmo/api
```

Aplicar migrations em producao:

```bash
npm run prisma:deploy -w @anselmo/api
```

## Banco de dados

Tabelas modeladas:

```txt
users
architects
terrains
terrain_images
projects
project_images
project_compatibility
simulations
orders
contracts
payments
favorites
notifications
```

Principais enums:

```txt
UserRole
UserStatus
TerrainStatus
ProjectStatus
CompatibilityStatus
SimulationStatus
OrderStatus
PaymentProvider
PaymentStatus
ContractStatus
NotificationType
Currency
```

Roles de usuario:

```txt
ADMIN
ARCHITECT
CUSTOMER
TERRAIN_OWNER
```

## API

Prefixo global:

```txt
/api/v1
```

Swagger:

```txt
/docs
```

Endpoints iniciais importantes:

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me

GET  /api/v1/terrains
GET  /api/v1/terrains/:id
POST /api/v1/terrains
PATCH /api/v1/terrains/:id

GET  /api/v1/projects
GET  /api/v1/projects/:id
POST /api/v1/projects
PATCH /api/v1/projects/:id

GET  /api/v1/simulations/caixa-rules
POST /api/v1/simulations/caixa-preview
POST /api/v1/simulations
POST /api/v1/payments/orders
POST /api/v1/payments/checkout
POST /api/v1/payments/webhooks/:provider

GET  /api/v1/favorites
POST /api/v1/favorites
DELETE /api/v1/favorites/:id

GET  /api/v1/notifications
PATCH /api/v1/notifications/:id/read

GET  /api/v1/admin/metrics
```

## Fluxo de autenticacao

1. Usuario cria conta em `/auth/register`.
2. API salva usuario com senha criptografada por bcrypt.
3. API devolve `accessToken`, `refreshToken` e `user`.
4. Frontend salva token via Zustand/localStorage.
5. Requisicoes autenticadas enviam:

```txt
Authorization: Bearer SEU_ACCESS_TOKEN
```

6. Guards validam JWT e roles.

## Simulacao base para atendimento

A tela `/simulacao` tem uma pre-analise simples para saber se a renda, entrada e perfil do cliente cabem na media da casa desejada.

Documento especifico da regra:

```txt
docs/simulacao.md
```

A pre-analise roda no frontend, sem chamar API, e considera:

- dados pessoais e contato;
- renda mensal, tipo de renda, comprovacao e composicao de renda;
- restricao, score aproximado, emprestimos e financiamento atual;
- valor do imovel desejado;
- tipo do imovel;
- entrada em dinheiro;
- FGTS informado;
- idade do comprador;
- base de terreno + projeto + obra quando o cliente veio de um terreno.

Calculo simplificado:

```txt
parcela_maxima = renda_considerada * 0.30 - dividas
credito_medio = parcela_maxima * 180
faixa_recomendada = credito_medio + entrada + FGTS
```

O resultado mostra:

- chance de aprovacao;
- score interno;
- credito medio;
- faixa de imovel recomendada;
- entrada sugerida;
- parcela base;
- se a casa desejada cabe, se so da para estudar o terreno ou se a base esta fraca.

Quando o cliente clica em `Falar com atendente`, o frontend cadastra um pedido local no painel usando o store:

```txt
apps/web/stores/simulation-requests-store.ts
```

Observacao importante: a ferramenta e apenas triagem comercial. Ela nao consulta banco, nao garante aprovacao e nao substitui simulacao oficial da instituicao financeira.

## Frontend

Paginas criadas:

```txt
/
/login
/register
/dashboard
/terrenos
/terrenos/:id
/projetos
/projetos/:id
/painel-arquiteto
/admin
/favoritos
/checkout
/simulacao
/termos
/privacidade
/cookies
```

## Privacidade, cookies e LGPD

O frontend tem uma camada inicial de conformidade com LGPD:

- banner de consentimento aparece no primeiro acesso;
- apenas recursos necessarios ficam ativos por padrao;
- preferencias, midia opcional, analytics e marketing ficam desligados ate o usuario aceitar;
- banners e imagens essenciais do catalogo podem carregar para nao esconder a interface principal;
- o usuario pode aceitar tudo, rejeitar opcionais ou personalizar categoria por categoria;
- o rodape e a pagina `/cookies` permitem reabrir as preferencias pelo botao `Gerenciar cookies`;
- cadastro exige aceite dos Termos, Politica de Privacidade e Politica de Cookies.

Paginas legais:

```txt
/termos
/privacidade
/cookies
```

Arquivos principais:

```txt
apps/web/stores/consent-store.ts
apps/web/components/privacy/cookie-consent.tsx
apps/web/components/privacy/privacy-image.tsx
apps/web/components/privacy/cookie-preferences-button.tsx
apps/web/app/termos/page.tsx
apps/web/app/privacidade/page.tsx
apps/web/app/cookies/page.tsx
```

O consentimento fica salvo no navegador com a chave:

```txt
anselmo.lgpd.consent.v1
```

Para testar do zero no navegador, apague essa chave do localStorage ou abra em uma janela anonima. Sem consentimento, scripts opcionais de analytics/marketing devem continuar desligados.

Camadas importantes:

```txt
apps/web/services
```

Cliente HTTP com Axios.

```txt
apps/web/hooks
```

Hooks com React Query.

```txt
apps/web/stores
```

Estado global com Zustand.

```txt
apps/web/providers
```

Providers globais de React Query e tema.

```txt
apps/web/components
```

Componentes reutilizaveis.

## Build

Build completo:

```bash
npm run build
```

Build somente API:

```bash
npm run build -w @anselmo/api
```

Build somente Web:

```bash
npm run build -w @anselmo/web
```

## Validacao

Typecheck completo:

```bash
npm run typecheck
```

Typecheck da API:

```bash
npm run typecheck -w @anselmo/api
```

Typecheck do frontend:

```bash
npm run typecheck -w @anselmo/web
```

Lint completo:

```bash
npm run lint
```

Lint da API:

```bash
npm run lint -w @anselmo/api
```

Lint do frontend:

```bash
npm run lint -w @anselmo/web
```

## Problemas comuns

### Prisma reclamando do Node

Erro comum:

```txt
Prisma only supports Node.js versions 20.19+, 22.12+, 24.0+
```

Solucao:

```bash
node -v
```

Atualize para Node `22.12+`.

### Docker nao conecta

Erro comum:

```txt
dockerDesktopLinuxEngine: The system cannot find the file specified
```

Solucao:

- abra o Docker Desktop;
- espere o engine iniciar;
- rode novamente `docker compose up`.

### API local nao conecta no banco

Se a API estiver local, use `localhost`:

```env
DATABASE_URL=postgresql://anselmo:anselmo_dev_password@localhost:5432/anselmo_marketplace?schema=public
```

Se a API estiver no Docker, use `postgres`:

```env
DATABASE_URL=postgresql://anselmo:anselmo_dev_password@postgres:5432/anselmo_marketplace?schema=public
```

### Frontend nao acha a API

Confira:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333/api/v1
```

Depois reinicie o frontend.

## Ordem recomendada para continuar o desenvolvimento

1. Atualizar Node para `22.12+`.
2. Rodar `npm install`.
3. Rodar `npm run prisma:generate`.
4. Criar migration inicial com Prisma.
5. Subir API e Web.
6. Criar seed com admin, arquiteto, terrenos e projetos fake.
7. Adicionar testes de auth, terrenos, projetos e pagamentos.
8. Implementar provider real de upload S3/R2.
9. Implementar provider real de pagamento.
10. Criar CI/CD.

## Comandos mais usados

```bash
npm install
npm run dev
npm run dev:api
npm run dev:web
npm run build
npm run typecheck
npm run lint
npm run prisma:generate
npm run prisma:migrate -w @anselmo/api -- --name init
npm run prisma:studio -w @anselmo/api
docker compose up -d postgres redis
docker compose -p projeto_anselmo up --build
docker compose -p projeto_anselmo down
```
