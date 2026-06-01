import { Project, Terrain } from "@/types/domain";

export const projectMocks: Project[] = [
  {
    id: "project-aurora",
    title: "Casa Aurora",
    slug: "casa-aurora",
    description: "Casa terrea com planta integrada, suite master e fachada de pedra natural.",
    bedrooms: 3,
    bathrooms: 4,
    areaM2: 214,
    minFrontageM: 12,
    minDepthM: 28,
    estimatedBuildCost: 980000,
    price: 42000,
    style: "Contemporaneo",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        altText: "Casa contemporanea"
      }
    ],
    architect: { user: { name: "Atelier Prado" } }
  },
  {
    id: "project-linear",
    title: "Casa Linear Patio",
    slug: "casa-linear-patio",
    description: "Projeto compacto com patio central, boa insolacao e estrutura modular.",
    bedrooms: 2,
    bathrooms: 3,
    areaM2: 168,
    minFrontageM: 5,
    minDepthM: 20,
    estimatedBuildCost: 720000,
    price: 36000,
    style: "Minimalista",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
        altText: "Fachada residencial minimalista"
      }
    ],
    architect: { user: { name: "Studio Linha" } }
  }
];

export const terrainMocks: Terrain[] = [
  {
    id: "terrain-aldeia",
    title: "Lote Reserva Aldeia",
    slug: "lote-reserva-aldeia",
    description: "Terreno plano em condominio fechado, com frente ampla e vista permanente.",
    city: "Campinas",
    state: "SP",
    areaM2: 480,
    frontageM: 16,
    depthM: 30,
    price: 620000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        altText: "Terreno aberto com vegetacao"
      }
    ],
    compatibilities: [
      {
        id: "compat-aldeia-aurora",
        score: 96,
        status: "APPROVED",
        notes: "Projeto encaixa bem em lote plano com frente de 16m.",
        project: projectMocks[0]
      },
      {
        id: "compat-aldeia-linear",
        score: 88,
        status: "APPROVED",
        notes: "Sobra area para jardim, piscina ou ampliacao futura.",
        project: projectMocks[1]
      }
    ]
  },
  {
    id: "terrain-serra",
    title: "Terreno Vista Serra",
    slug: "terreno-vista-serra",
    description: "Lote em declive suave para projeto contemporaneo com piscina elevada.",
    city: "Nova Lima",
    state: "MG",
    areaM2: 720,
    frontageM: 20,
    depthM: 36,
    price: 890000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
        altText: "Terreno proximo a area verde"
      }
    ],
    compatibilities: [
      {
        id: "compat-serra-aurora",
        score: 91,
        status: "APPROVED",
        notes: "Boa implantacao para casa terrea com vista.",
        project: projectMocks[0]
      }
    ]
  }
];
