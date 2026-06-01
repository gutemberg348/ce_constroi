FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace @anselmo/api --include-workspace-root

FROM node:22-alpine AS builder
WORKDIR /app
ENV DATABASE_URL=postgresql://anselmo:anselmo_dev_password@postgres:5432/anselmo_marketplace?schema=public
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate -w @anselmo/api
RUN npm run build -w @anselmo/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
WORKDIR /app/apps/api
EXPOSE 3333
CMD ["node", "dist/src/main.js"]
