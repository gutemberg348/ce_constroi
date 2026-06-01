Você é um arquiteto de software sênior especializado em NestJS, Next.js, PostgreSQL, Docker, Prisma e sistemas SaaS escaláveis.

Quero que você crie a estrutura COMPLETA de um sistema marketplace de arquitetura e terrenos.

# STACK OBRIGATÓRIA

Frontend:
- Next.js (App Router)
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

Banco:
- PostgreSQL

Infra:
- Docker
- Docker Compose

Uploads:
- AWS S3 ou Cloudflare R2

# OBJETIVO DO SISTEMA

O sistema será uma plataforma onde:

- usuários poderão visualizar terrenos;
- arquitetos poderão cadastrar projetos arquitetônicos;
- terrenos poderão ser vinculados a projetos compatíveis;
- o cliente poderá visualizar como a casa ficará no terreno;
- o cliente poderá comprar:
  - apenas o terreno;
  - apenas o projeto;
  - ambos;
- haverá simulação financeira;
- haverá split de pagamento;
- haverá múltiplos painéis.

# ARQUITETURA OBRIGATÓRIA

Quero arquitetura enterprise.

Use:
- Clean Architecture
- SOLID
- Repository Pattern
- DTOs
- Guards
- Interceptors
- Services
- Modules
- Providers
- Middlewares
- Validation Pipes

# BACKEND

Crie estrutura completa NestJS modularizada.

Módulos obrigatórios:

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

# AUTENTICAÇÃO

Implementar:
- JWT access token
- refresh token
- roles
- guards
- bcrypt
- autenticação via email/senha

Tipos de usuários:
- admin
- architect
- customer
- terrain_owner

# BANCO DE DADOS

Use Prisma.

Crie schema.prisma COMPLETO.

Tabelas obrigatórias:
- users
- architects
- terrains
- terrain_images
- projects
- project_images
- project_compatibility
- simulations
- orders
- contracts
- payments
- favorites
- notifications

Relacionamentos completos.

Inclua:
- createdAt
- updatedAt
- soft delete
- indexes
- enums
- foreign keys

# FRONTEND

Criar frontend profissional moderno.

Estrutura:
- app/
- components/
- services/
- hooks/
- stores/
- types/
- providers/
- layouts/

Páginas:
- home
- login
- register
- dashboard
- terrenos
- detalhes do terreno
- projetos
- detalhes do projeto
- painel do arquiteto
- painel admin
- favoritos
- checkout
- simulação

# DESIGN

Visual:
- moderno
- tecnológico
- premium
- minimalista
- estilo startup bilionária

Use:
- cards modernos
- gradientes
- animações suaves
- responsividade total

# FUNCIONALIDADES IMPORTANTES

# TERRENOS

Cada terreno deve possuir:
- nome
- descrição
- localização
- metragem
- preço
- status
- imagens
- compatibilidade com projetos

# PROJETOS

Cada projeto deve possuir:
- nome
- descrição
- render 3D
- planta
- quartos
- banheiros
- metragem
- valor
- imagens

# SIMULAÇÃO

Criar sistema de simulação:
- valor do terreno
- valor do projeto
- estimativa da obra
- parcelas
- financiamento

# CHECKOUT

Implementar estrutura preparada para:
- Asaas
- Stripe
- Mercado Pago

Com:
- split de pagamento
- webhook
- confirmação automática

# ADMIN

Dashboard admin com:
- métricas
- usuários
- vendas
- arquitetos
- terrenos
- projetos
- analytics

# PAINEL ARQUITETO

- upload de projetos
- gerenciamento
- vendas
- estatísticas

# INFRAESTRUTURA

Criar:
- Dockerfile frontend
- Dockerfile backend
- docker-compose.yml
- PostgreSQL container
- Redis container

# REDIS

Usar para:
- cache
- sessões
- filas
- rate limiting

# SWAGGER

Documentar toda API.

# SEGURANÇA

Implementar:
- rate limit
- helmet
- cors
- validation
- sanitização
- guards

# PADRÕES

Use:
- aliases
- env variables
- config module
- logs
- exception filters

# O QUE EU QUERO AGORA

1. Estrutura completa de pastas
2. Arquitetura do sistema
3. Modelagem do banco
4. Fluxo das APIs
5. Fluxo frontend/backend
6. Estrutura Docker
7. Estrutura Prisma
8. Código inicial completo
9. Configuração inicial de ambiente
10. Roadmap de desenvolvimento

# IMPORTANTE

- Gere código REAL e profissional.
- Não gere exemplos simplificados.
- Pense como uma startup avaliada em milhões.
- O projeto precisa ser escalável.
- O código precisa estar organizado para equipe grande.
- Use melhores práticas atuais de 2026.
- Quero estrutura pronta para produção.

# EXTRA

Adicionar:
- sistema de favoritos
- notificações
- upload de múltiplas imagens
- paginação
- filtros avançados
- busca
- SEO
- SSR
- proteção de rotas
- dark mode
- analytics

# ENTREGA

Comece:
1. pela arquitetura geral;
2. depois estrutura de pastas;
3. depois banco;
4. depois backend;
5. depois frontend;
6. depois docker;
7. depois roadmap.

Depois gere os primeiros códigos iniciais do projeto.