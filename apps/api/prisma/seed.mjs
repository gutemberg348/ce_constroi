import "dotenv/config";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcrypt");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../dist/src/generated/prisma/client.js");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })
});

const credentials = {
  admin: {
    name: "Admin Anselmo",
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@anselmo.dev",
    password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456"
  },
  architect: {
    name: "Atelier Prado",
    email: process.env.SEED_ARCHITECT_EMAIL ?? "arquiteto@anselmo.dev",
    password: process.env.SEED_ARCHITECT_PASSWORD ?? "Arq@123456"
  },
  pendingArchitect: {
    name: "Studio Pendente",
    email: process.env.SEED_PENDING_ARCHITECT_EMAIL ?? "pendente@anselmo.dev",
    password: process.env.SEED_PENDING_ARCHITECT_PASSWORD ?? "Arq@123456"
  },
  customer: {
    name: "Cliente Demo",
    email: process.env.SEED_CUSTOMER_EMAIL ?? "cliente@anselmo.dev",
    password: process.env.SEED_CUSTOMER_PASSWORD ?? "Cliente@123456"
  }
};

async function upsertUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      status: "ACTIVE",
      passwordHash
    },
    create: {
      name,
      email,
      role,
      status: "ACTIVE",
      passwordHash,
      emailVerifiedAt: new Date()
    }
  });
}

async function ensureTerrainImage({ terrainId, url, storageKey, altText, isCover = false, sortOrder = 0 }) {
  const existing = await prisma.terrainImage.findFirst({ where: { storageKey } });
  if (existing) {
    return existing;
  }

  return prisma.terrainImage.create({
    data: { terrainId, url, storageKey, altText, isCover, sortOrder }
  });
}

async function ensureProjectImage({ projectId, url, storageKey, altText, isCover = false, sortOrder = 0 }) {
  const existing = await prisma.projectImage.findFirst({ where: { storageKey } });
  if (existing) {
    return existing;
  }

  return prisma.projectImage.create({
    data: { projectId, url, storageKey, altText, isCover, sortOrder }
  });
}

async function main() {
  const [admin, architectUser, pendingArchitectUser, customer] = await Promise.all([
    upsertUser({ ...credentials.admin, role: "ADMIN" }),
    upsertUser({ ...credentials.architect, role: "ARCHITECT" }),
    upsertUser({ ...credentials.pendingArchitect, role: "ARCHITECT" }),
    upsertUser({ ...credentials.customer, role: "CUSTOMER" })
  ]);

  const architect = await prisma.architect.upsert({
    where: { userId: architectUser.id },
    update: {
      companyName: "Atelier Prado Arquitetura",
      bio: "Projetos residenciais premium com foco em implantacao, conforto ambiental e construcao inteligente.",
      cauNumber: "CAU-A000001",
      website: "https://atelier-prado.example",
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedById: admin.id,
      rejectionReason: null
    },
    create: {
      userId: architectUser.id,
      companyName: "Atelier Prado Arquitetura",
      bio: "Projetos residenciais premium com foco em implantacao, conforto ambiental e construcao inteligente.",
      cauNumber: "CAU-A000001",
      website: "https://atelier-prado.example",
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedById: admin.id
    }
  });

  const pendingArchitect = await prisma.architect.upsert({
    where: { userId: pendingArchitectUser.id },
    update: {
      companyName: "Studio Pendente",
      bio: "Cadastro aguardando curadoria administrativa.",
      cauNumber: "CAU-P000002",
      website: "https://studio-pendente.example",
      status: "PENDING_REVIEW",
      reviewedAt: null,
      reviewedById: null,
      rejectionReason: null
    },
    create: {
      userId: pendingArchitectUser.id,
      companyName: "Studio Pendente",
      bio: "Cadastro aguardando curadoria administrativa.",
      cauNumber: "CAU-P000002",
      website: "https://studio-pendente.example",
      status: "PENDING_REVIEW"
    }
  });

  const terrainA = await prisma.terrain.upsert({
    where: { slug: "lote-reserva-aldeia" },
    update: {
      title: "Lote Reserva Aldeia",
      description: "Terreno plano em condominio fechado, com frente ampla, infraestrutura completa e vista permanente.",
      address: "Alameda das Aroeiras, 120",
      city: "Campinas",
      state: "SP",
      zipCode: "13000-000",
      areaM2: 480,
      frontageM: 16,
      depthM: 30,
      price: 620000,
      zoning: "Residencial alto padrao",
      status: "AVAILABLE"
    },
    create: {
      title: "Lote Reserva Aldeia",
      slug: "lote-reserva-aldeia",
      description: "Terreno plano em condominio fechado, com frente ampla, infraestrutura completa e vista permanente.",
      address: "Alameda das Aroeiras, 120",
      city: "Campinas",
      state: "SP",
      zipCode: "13000-000",
      areaM2: 480,
      frontageM: 16,
      depthM: 30,
      price: 620000,
      zoning: "Residencial alto padrao",
      status: "AVAILABLE"
    }
  });

  const terrainB = await prisma.terrain.upsert({
    where: { slug: "terreno-vista-serra" },
    update: {
      title: "Terreno Vista Serra",
      description: "Lote em declive suave para residencia contemporanea com area gourmet e piscina elevada.",
      address: "Rua do Mirante, 88",
      city: "Nova Lima",
      state: "MG",
      zipCode: "34000-000",
      areaM2: 720,
      frontageM: 20,
      depthM: 36,
      price: 890000,
      zoning: "Residencial montanha",
      status: "AVAILABLE"
    },
    create: {
      title: "Terreno Vista Serra",
      slug: "terreno-vista-serra",
      description: "Lote em declive suave para residencia contemporanea com area gourmet e piscina elevada.",
      address: "Rua do Mirante, 88",
      city: "Nova Lima",
      state: "MG",
      zipCode: "34000-000",
      areaM2: 720,
      frontageM: 20,
      depthM: 36,
      price: 890000,
      zoning: "Residencial montanha",
      status: "AVAILABLE"
    }
  });

  await Promise.all([
    ensureTerrainImage({
      terrainId: terrainA.id,
      url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85",
      storageKey: "seed/terrains/lote-reserva-aldeia-cover",
      altText: "Terreno aberto com vegetacao",
      isCover: true
    }),
    ensureTerrainImage({
      terrainId: terrainB.id,
      url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1400&q=85",
      storageKey: "seed/terrains/terreno-vista-serra-cover",
      altText: "Terreno proximo a area verde",
      isCover: true
    })
  ]);

  const projectA = await prisma.project.upsert({
    where: { slug: "casa-aurora" },
    update: {
      architectId: architect.id,
      title: "Casa Aurora",
      description: "Casa terrea premium com suite master, cozinha integrada, varandas generosas e fachada de pedra natural.",
      style: "Contemporaneo",
      bedrooms: 3,
      bathrooms: 4,
      suites: 2,
      parkingSpaces: 2,
      floors: 1,
      areaM2: 214,
      estimatedBuildCost: 980000,
      price: 42000,
      status: "PUBLISHED"
    },
    create: {
      architectId: architect.id,
      title: "Casa Aurora",
      slug: "casa-aurora",
      description: "Casa terrea premium com suite master, cozinha integrada, varandas generosas e fachada de pedra natural.",
      style: "Contemporaneo",
      bedrooms: 3,
      bathrooms: 4,
      suites: 2,
      parkingSpaces: 2,
      floors: 1,
      areaM2: 214,
      estimatedBuildCost: 980000,
      price: 42000,
      status: "PUBLISHED"
    }
  });

  const projectB = await prisma.project.upsert({
    where: { slug: "casa-linear-patio" },
    update: {
      architectId: architect.id,
      title: "Casa Linear Patio",
      description: "Projeto compacto com patio central, excelente insolacao e estrutura modular para obra eficiente.",
      style: "Minimalista",
      bedrooms: 2,
      bathrooms: 3,
      suites: 1,
      parkingSpaces: 2,
      floors: 1,
      areaM2: 168,
      estimatedBuildCost: 720000,
      price: 36000,
      status: "PUBLISHED"
    },
    create: {
      architectId: architect.id,
      title: "Casa Linear Patio",
      slug: "casa-linear-patio",
      description: "Projeto compacto com patio central, excelente insolacao e estrutura modular para obra eficiente.",
      style: "Minimalista",
      bedrooms: 2,
      bathrooms: 3,
      suites: 1,
      parkingSpaces: 2,
      floors: 1,
      areaM2: 168,
      estimatedBuildCost: 720000,
      price: 36000,
      status: "PUBLISHED"
    }
  });

  await Promise.all([
    ensureProjectImage({
      projectId: projectA.id,
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
      storageKey: "seed/projects/casa-aurora-cover",
      altText: "Casa contemporanea",
      isCover: true
    }),
    ensureProjectImage({
      projectId: projectB.id,
      url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
      storageKey: "seed/projects/casa-linear-patio-cover",
      altText: "Fachada residencial minimalista",
      isCover: true
    })
  ]);

  await Promise.all([
    prisma.projectCompatibility.upsert({
      where: { terrainId_projectId: { terrainId: terrainA.id, projectId: projectA.id } },
      update: { status: "APPROVED", score: 96, notes: "Implantacao ideal para lote plano com frente de 16m." },
      create: {
        terrainId: terrainA.id,
        projectId: projectA.id,
        status: "APPROVED",
        score: 96,
        notes: "Implantacao ideal para lote plano com frente de 16m."
      }
    }),
    prisma.projectCompatibility.upsert({
      where: { terrainId_projectId: { terrainId: terrainB.id, projectId: projectB.id } },
      update: { status: "APPROVED", score: 91, notes: "Boa leitura de relevo e patio protegido." },
      create: {
        terrainId: terrainB.id,
        projectId: projectB.id,
        status: "APPROVED",
        score: 91,
        notes: "Boa leitura de relevo e patio protegido."
      }
    })
  ]);

  await prisma.favorite.upsert({
    where: { userId_terrainId: { userId: customer.id, terrainId: terrainA.id } },
    update: {},
    create: { userId: customer.id, terrainId: terrainA.id }
  });

  console.log("Seed concluido.");
  console.table([
    { perfil: "Admin", email: credentials.admin.email, senha: credentials.admin.password },
    { perfil: "Arquiteto aprovado", email: credentials.architect.email, senha: credentials.architect.password },
    { perfil: "Arquiteto pendente", email: credentials.pendingArchitect.email, senha: credentials.pendingArchitect.password },
    { perfil: "Cliente", email: credentials.customer.email, senha: credentials.customer.password }
  ]);
  console.log(`Arquiteto pendente para aprovar no admin: ${pendingArchitect.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
