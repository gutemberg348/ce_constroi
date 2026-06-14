# Anselmo Marketplace

Base enterprise para um marketplace de terrenos, projetos arquitetonicos, simulacao financeira, checkout com split, favoritos, notificacoes e paineis administrativos.

## Stack

- Frontend: Next.js App Router, React, TypeScript, TailwindCSS, React Query, Axios, Zustand.
- Backend: NestJS, TypeScript, Prisma, JWT Auth, Swagger.
- Banco: PostgreSQL.
- Infra: Docker Compose com PostgreSQL, Redis, API e Web.
- Uploads: adapter preparado para S3 ou Cloudflare R2.

## Como iniciar

Requer Node.js `22.12+` ou Docker com engine ativo.

Guia completo: [docs/guia_completo.md](docs/guia_completo.md)

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

API: `http://localhost:3333/api/v1`

Swagger: `http://localhost:3333/docs`

Web: `http://localhost:3000`

## Docker

```bash
cp .env.example .env
docker compose up --build
```

O banco PostgreSQL usa o volume nomeado `postgres_data`, entao `docker compose up --build` recria containers/imagens sem apagar os dados. Para parar sem perder dados use:

```bash
docker compose down
```

Evite `docker compose down -v`, `docker volume rm` ou apagar volumes pelo Docker Desktop em ambiente com dados que voce quer manter.

## Deploy na VPS

O script constroi as imagens antes de parar os containers. Se o build falhar, o deploy para e a versao atual continua rodando.

```bash
chmod +x scripts/deploy-vps.sh

# Somente alteracoes do site/header
./scripts/deploy-vps.sh web

# API e site
./scripts/deploy-vps.sh api web
```
