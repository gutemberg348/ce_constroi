import { config as loadEnv } from "dotenv";
import { createRequire } from "node:module";
import { resolve } from "node:path";

for (const envPath of [".env.local", "../../.env.local", ".env", "../../.env"]) {
  loadEnv({ path: resolve(process.cwd(), envPath), override: false });
}

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
  },
  terrainOwner: {
    name: "Proprietario Demo",
    email: process.env.SEED_TERRAIN_OWNER_EMAIL ?? "proprietario@anselmo.dev",
    password: process.env.SEED_TERRAIN_OWNER_PASSWORD ?? "Prop@123456"
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
    return prisma.terrainImage.update({
      where: { id: existing.id },
      data: { terrainId, url, altText, isCover, sortOrder, deletedAt: null }
    });
  }

  return prisma.terrainImage.create({
    data: { terrainId, url, storageKey, altText, isCover, sortOrder }
  });
}

async function ensureProjectImage({ projectId, url, storageKey, altText, isCover = false, sortOrder = 0 }) {
  const existing = await prisma.projectImage.findFirst({ where: { storageKey } });
  if (existing) {
    return prisma.projectImage.update({
      where: { id: existing.id },
      data: { projectId, url, altText, isCover, sortOrder, deletedAt: null }
    });
  }

  return prisma.projectImage.create({
    data: { projectId, url, storageKey, altText, isCover, sortOrder }
  });
}

async function main() {
  const [admin, architectUser, pendingArchitectUser, customer, terrainOwner] = await Promise.all([
    upsertUser({ ...credentials.admin, role: "ADMIN" }),
    upsertUser({ ...credentials.architect, role: "ARCHITECT" }),
    upsertUser({ ...credentials.pendingArchitect, role: "ARCHITECT" }),
    upsertUser({ ...credentials.customer, role: "CUSTOMER" }),
    upsertUser({ ...credentials.terrainOwner, role: "TERRAIN_OWNER" })
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

  const terrainSeeds = [
    {
      title: "Lote Reserva Aldeia",
      slug: "lote-reserva-aldeia",
      description: "Lote amplo em condominio consolidado, com rua arborizada, seguranca e excelente insolacao.",
      address: "Alameda das Aroeiras, 120",
      neighborhood: "Reserva Aldeia",
      city: "Campinas",
      state: "SP",
      zipCode: "13098-000",
      areaM2: 480,
      frontageM: 16,
      depthM: 30,
      price: 620000,
      zoning: "Residencial alto padrao",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/lote-reserva-aldeia-cover",
        altText: "Lote amplo em condominio arborizado"
      }
    },
    {
      title: "Terreno Vista Serra",
      slug: "terreno-vista-serra",
      description: "Terreno de esquina com vista aberta para serra, leve aclive e perfil residencial de alto padrao.",
      address: "Rua do Mirante, 88",
      neighborhood: "Vila da Serra",
      city: "Nova Lima",
      state: "MG",
      zipCode: "34006-000",
      areaM2: 720,
      frontageM: 20,
      depthM: 36,
      price: 890000,
      zoning: "Residencial montanha",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/terreno-vista-serra-cover",
        altText: "Terreno com vista para area verde"
      }
    },
    {
      title: "Lote Jardim do Lago",
      slug: "lote-jardim-do-lago",
      description: "Terreno plano em rua residencial, proximo a mercado, escola e acesso rapido ao centro.",
      address: "Rua das Quaresmeiras, 42",
      neighborhood: "Jardim do Lago",
      city: "Campinas",
      state: "SP",
      zipCode: "13000-000",
      areaM2: 336,
      frontageM: 12,
      depthM: 28,
      price: 180000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/lote-jardim-do-lago-cover",
        altText: "Terreno aberto com vegetacao"
      }
    },
    {
      title: "Terreno Residencial Eden",
      slug: "terreno-residencial-eden",
      description: "Lote com topografia leve, boa insolacao da manha e vizinhanca ja formada.",
      address: "Rua Joao Guimaraes, 118",
      neighborhood: "Eden",
      city: "Sorocaba",
      state: "SP",
      zipCode: "18103-000",
      areaM2: 300,
      frontageM: 10,
      depthM: 30,
      price: 145000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/terreno-residencial-eden-cover",
        altText: "Lote gramado em rua residencial"
      }
    },
    {
      title: "Lote Bonfim Paulista",
      slug: "lote-bonfim-paulista",
      description: "Terreno limpo em bairro tranquilo, com comercio local e facil ligacao para rodovia.",
      address: "Avenida das Palmeiras, 305",
      neighborhood: "Bonfim Paulista",
      city: "Ribeirao Preto",
      state: "SP",
      zipCode: "14110-000",
      areaM2: 275,
      frontageM: 11,
      depthM: 25,
      price: 165000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1518481852452-9415b262eba4?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/lote-bonfim-paulista-cover",
        altText: "Terreno residencial com vegetacao baixa"
      }
    },
    {
      title: "Lote Setor Faicalville",
      slug: "lote-setor-faicalville",
      description: "Lote regular em regiao consolidada, perto de servicos e corredores de transporte.",
      address: "Rua F-12, Quadra 8",
      neighborhood: "Setor Faicalville",
      city: "Goiania",
      state: "GO",
      zipCode: "74350-000",
      areaM2: 360,
      frontageM: 12,
      depthM: 30,
      price: 220000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/lote-setor-faicalville-cover",
        altText: "Rua residencial arborizada"
      }
    },
    {
      title: "Terreno Santa Monica",
      slug: "terreno-santa-monica",
      description: "Lote plano com documentacao regular e bom acesso a universidades e comercio.",
      address: "Rua Inglaterra, 77",
      neighborhood: "Santa Monica",
      city: "Uberlandia",
      state: "MG",
      zipCode: "38408-000",
      areaM2: 250,
      frontageM: 10,
      depthM: 25,
      price: 155000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/terreno-santa-monica-cover",
        altText: "Frente de bairro residencial"
      }
    },
    {
      title: "Lote Vila Nova",
      slug: "lote-vila-nova",
      description: "Terreno em rua calma, com infraestrutura completa e boa orientacao solar.",
      address: "Rua XV de Novembro, 920",
      neighborhood: "Vila Nova",
      city: "Joinville",
      state: "SC",
      zipCode: "89237-000",
      areaM2: 300,
      frontageM: 12,
      depthM: 25,
      price: 190000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/lote-vila-nova-cover",
        altText: "Casa e terreno em area verde"
      }
    },
    {
      title: "Terreno Santa Candida",
      slug: "terreno-santa-candida",
      description: "Lote urbano com leve declive, perto de linhas de onibus e parques de bairro.",
      address: "Rua Theodoro Makiolka, 540",
      neighborhood: "Santa Candida",
      city: "Curitiba",
      state: "PR",
      zipCode: "82640-000",
      areaM2: 240,
      frontageM: 8,
      depthM: 30,
      price: 175000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/terreno-santa-candida-cover",
        altText: "Terreno em area urbana"
      }
    },
    {
      title: "Lote Piata",
      slug: "lote-piata",
      description: "Terreno regular a poucos minutos da orla, com potencial para casa compacta.",
      address: "Rua Ilha Azul, 64",
      neighborhood: "Piata",
      city: "Salvador",
      state: "BA",
      zipCode: "41650-000",
      areaM2: 200,
      frontageM: 10,
      depthM: 20,
      price: 135000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/lote-piata-cover",
        altText: "Terreno aberto em dia claro"
      }
    },
    {
      title: "Terreno Varzea",
      slug: "terreno-varzea",
      description: "Lote em bairro residencial com servicos proximos e bom custo de entrada.",
      address: "Rua Academico Helio Ramos, 214",
      neighborhood: "Varzea",
      city: "Recife",
      state: "PE",
      zipCode: "50740-000",
      areaM2: 220,
      frontageM: 10,
      depthM: 22,
      price: 125000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/terreno-varzea-cover",
        altText: "Rua residencial com vegetacao"
      }
    },
    {
      title: "Lote Messejana",
      slug: "lote-messejana",
      description: "Terreno plano em loteamento com ruas abertas e infraestrutura essencial.",
      address: "Rua Padre Pedro de Alencar, 460",
      neighborhood: "Messejana",
      city: "Fortaleza",
      state: "CE",
      zipCode: "60840-000",
      areaM2: 180,
      frontageM: 9,
      depthM: 20,
      price: 95000,
      zoning: "Residencial",
      status: "AVAILABLE",
      image: {
        url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1400&q=85",
        storageKey: "seed/terrains/lote-messejana-cover",
        altText: "Terreno proximo a area verde"
      }
    }
  ];

  const terrains = await Promise.all(
    terrainSeeds.map(async ({ image, ...terrain }) => {
      const upserted = await prisma.terrain.upsert({
        where: { slug: terrain.slug },
        update: terrain,
        create: terrain
      });

      await ensureTerrainImage({
        terrainId: upserted.id,
        url: image.url,
        storageKey: image.storageKey,
        altText: image.altText,
        isCover: true
      });

      return upserted;
    })
  );

  await prisma.terrain.updateMany({
    where: {
      slug: {
        in: ["lote-jardim-do-lago", "terreno-residencial-eden", "lote-messejana"]
      }
    },
    data: { ownerId: terrainOwner.id }
  });

  const [
    terrainA,
    terrainB,
    terrainC,
    terrainD,
    terrainE,
    terrainF,
    terrainG,
    terrainH,
    terrainI,
    terrainJ,
    terrainK,
    terrainL
  ] = terrains;

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

  const projectC = await prisma.project.upsert({
    where: { slug: "casa-essencial-92" },
    update: {
      architectId: architect.id,
      title: "Casa Essencial 92",
      description: "Casa economica com dois quartos, cozinha integrada e obra simples para lotes menores.",
      style: "Economico",
      bedrooms: 2,
      bathrooms: 2,
      suites: 1,
      parkingSpaces: 1,
      floors: 1,
      areaM2: 92,
      estimatedBuildCost: 320000,
      price: 18000,
      status: "PUBLISHED"
    },
    create: {
      architectId: architect.id,
      title: "Casa Essencial 92",
      slug: "casa-essencial-92",
      description: "Casa economica com dois quartos, cozinha integrada e obra simples para lotes menores.",
      style: "Economico",
      bedrooms: 2,
      bathrooms: 2,
      suites: 1,
      parkingSpaces: 1,
      floors: 1,
      areaM2: 92,
      estimatedBuildCost: 320000,
      price: 18000,
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
    }),
    ensureProjectImage({
      projectId: projectC.id,
      url: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1400&q=85",
      storageKey: "seed/projects/casa-essencial-92-cover",
      altText: "Casa terrea simples",
      isCover: true
    })
  ]);

  const compatibilitySeeds = [
    { terrain: terrainA, project: projectA, score: 96, notes: "Implantacao ideal para lote plano com frente de 16m." },
    { terrain: terrainA, project: projectB, score: 88, notes: "Sobra area para jardim, piscina ou ampliacao futura." },
    { terrain: terrainB, project: projectA, score: 94, notes: "Projeto premium aproveita a frente larga e a vista do lote." },
    { terrain: terrainB, project: projectB, score: 86, notes: "Casa linear pode ser implantada preservando area de lazer externa." },
    { terrain: terrainC, project: projectC, score: 95, notes: "Casa economica cabe com boa area livre no fundo." },
    { terrain: terrainC, project: projectB, score: 88, notes: "Projeto linear tambem aproveita bem a frente de 12m." },
    { terrain: terrainD, project: projectC, score: 94, notes: "Projeto economico aproveita bem frente de 10m." },
    { terrain: terrainE, project: projectC, score: 91, notes: "Boa sobra lateral para jardim e ventilacao." },
    { terrain: terrainF, project: projectC, score: 92, notes: "Frente de 12m permite casa simples com garagem frontal." },
    { terrain: terrainF, project: projectB, score: 87, notes: "Tambem comporta o projeto linear com patio." },
    { terrain: terrainG, project: projectC, score: 93, notes: "Casa terrea encaixa com boa area livre no fundo." },
    { terrain: terrainH, project: projectC, score: 90, notes: "Lote comporta projeto com garagem frontal." },
    { terrain: terrainH, project: projectB, score: 86, notes: "Medidas tambem atendem o projeto linear." },
    { terrain: terrainI, project: projectC, score: 89, notes: "Projeto estreito favorece lote de 8m." },
    { terrain: terrainJ, project: projectC, score: 88, notes: "Boa opcao para planta compacta de dois quartos." },
    { terrain: terrainK, project: projectC, score: 86, notes: "Projeto menor mantem bom recuo frontal." },
    { terrain: terrainL, project: projectC, score: 84, notes: "Casa compacta cabe com area livre posterior." }
  ];

  await Promise.all(
    compatibilitySeeds.map(({ terrain, project, score, notes }) =>
      prisma.projectCompatibility.upsert({
        where: { terrainId_projectId: { terrainId: terrain.id, projectId: project.id } },
        update: { status: "APPROVED", score, notes },
        create: {
          terrainId: terrain.id,
          projectId: project.id,
          status: "APPROVED",
          score,
          notes
        }
      })
    )
  );

  await prisma.favorite.upsert({
    where: { userId_terrainId: { userId: customer.id, terrainId: terrainA.id } },
    update: {},
    create: { userId: customer.id, terrainId: terrainA.id }
  });

  const existingSimulation = await prisma.simulation.findFirst({
    where: {
      customerId: customer.id,
      terrainId: terrainC.id,
      projectId: projectC.id,
      deletedAt: null
    }
  });
  const simulationTotal = Number(terrainC.price) + Number(projectC.price) + Number(projectC.estimatedBuildCost);
  const simulationData = {
    customerId: customer.id,
    terrainId: terrainC.id,
    projectId: projectC.id,
    terrainPrice: terrainC.price,
    projectPrice: projectC.price,
    estimatedBuildCost: projectC.estimatedBuildCost,
    downPayment: 10000,
    installmentCount: 360,
    monthlyPayment: 2850,
    interestRate: 0.0085,
    totalAmount: simulationTotal,
    status: "SENT",
    metadata: {
      source: "seed-demo",
      packageMode: "TERRAIN_PROJECT_BUILD",
      note: "Pre-proposta demo cadastrada no PostgreSQL."
    }
  };
  const simulation = existingSimulation
    ? await prisma.simulation.update({ where: { id: existingSimulation.id }, data: simulationData })
    : await prisma.simulation.create({ data: simulationData });

  const existingOrder = await prisma.order.findFirst({
    where: {
      customerId: customer.id,
      simulationId: simulation.id,
      deletedAt: null
    }
  });
  const orderData = {
    customerId: customer.id,
    terrainId: terrainC.id,
    projectId: projectC.id,
    simulationId: simulation.id,
    subtotal: simulationTotal,
    fees: 0,
    discount: 0,
    total: simulationTotal,
    currency: "BRL",
    status: "PENDING_PAYMENT"
  };

  if (existingOrder) {
    await prisma.order.update({
      where: { id: existingOrder.id },
      data: orderData
    });
  } else {
    await prisma.order.create({ data: orderData });
  }

  console.log("Seed concluido.");
  console.table([
    { perfil: "Admin", email: credentials.admin.email, senha: credentials.admin.password },
    { perfil: "Arquiteto aprovado", email: credentials.architect.email, senha: credentials.architect.password },
    { perfil: "Arquiteto pendente", email: credentials.pendingArchitect.email, senha: credentials.pendingArchitect.password },
    { perfil: "Cliente", email: credentials.customer.email, senha: credentials.customer.password },
    { perfil: "Proprietario", email: credentials.terrainOwner.email, senha: credentials.terrainOwner.password }
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
