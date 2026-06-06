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
    status: "PUBLISHED",
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
    status: "PUBLISHED",
    style: "Minimalista",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
        altText: "Fachada residencial minimalista"
      }
    ],
    architect: { user: { name: "Studio Linha" } }
  },
  {
    id: "project-essencial-92",
    title: "Casa Essencial 92",
    slug: "casa-essencial-92",
    description: "Casa economica com dois quartos, cozinha integrada e obra simples para lotes menores.",
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 92,
    minFrontageM: 8,
    minDepthM: 20,
    estimatedBuildCost: 320000,
    price: 18000,
    status: "PUBLISHED",
    style: "Economico",
    images: [
      {
        url: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1200&q=80",
        altText: "Casa terrea simples"
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
    description: "Lote amplo em condominio consolidado, com rua arborizada, seguranca e excelente insolacao.",
    address: "Alameda das Aroeiras, 120",
    neighborhood: "Reserva Aldeia",
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
        altText: "Lote amplo em condominio arborizado"
      }
    ],
    compatibilities: [
      {
        id: "compat-aldeia-aurora",
        score: 96,
        status: "APPROVED",
        notes: "Implantacao ideal para lote plano com frente de 16m.",
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
    description: "Terreno de esquina com vista aberta para serra, leve aclive e perfil residencial de alto padrao.",
    address: "Rua do Mirante, 88",
    neighborhood: "Vila da Serra",
    city: "Nova Lima",
    state: "MG",
    areaM2: 720,
    frontageM: 20,
    depthM: 36,
    price: 890000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
        altText: "Terreno com vista para area verde"
      }
    ],
    compatibilities: [
      {
        id: "compat-serra-aurora",
        score: 94,
        status: "APPROVED",
        notes: "Projeto premium aproveita a frente larga e a vista do lote.",
        project: projectMocks[0]
      },
      {
        id: "compat-serra-linear",
        score: 86,
        status: "APPROVED",
        notes: "Casa linear pode ser implantada preservando area de lazer externa.",
        project: projectMocks[1]
      }
    ]
  },
  {
    id: "terrain-jardim-do-lago",
    title: "Lote Jardim do Lago",
    slug: "lote-jardim-do-lago",
    description: "Terreno plano em rua residencial, proximo a mercado, escola e acesso rapido ao centro.",
    address: "Rua das Quaresmeiras, 42",
    neighborhood: "Jardim do Lago",
    city: "Campinas",
    state: "SP",
    areaM2: 336,
    frontageM: 12,
    depthM: 28,
    price: 180000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        altText: "Terreno aberto com vegetacao"
      }
    ],
    compatibilities: [
      {
        id: "compat-jardim-lago-essencial",
        score: 95,
        status: "APPROVED",
        notes: "Casa economica cabe com boa area livre no fundo.",
        project: projectMocks[2]
      },
      {
        id: "compat-jardim-lago-linear",
        score: 88,
        status: "APPROVED",
        notes: "Projeto linear tambem aproveita bem a frente de 12m.",
        project: projectMocks[1]
      }
    ]
  },
  {
    id: "terrain-eden",
    title: "Terreno Residencial Eden",
    slug: "terreno-residencial-eden",
    description: "Lote com topografia leve, boa insolacao da manha e vizinhanca ja formada.",
    address: "Rua Joao Guimaraes, 118",
    neighborhood: "Eden",
    city: "Sorocaba",
    state: "SP",
    areaM2: 300,
    frontageM: 10,
    depthM: 30,
    price: 145000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
        altText: "Lote gramado em rua residencial"
      }
    ],
    compatibilities: [
      {
        id: "compat-eden-essencial",
        score: 94,
        status: "APPROVED",
        notes: "Projeto economico aproveita bem frente de 10m.",
        project: projectMocks[2]
      }
    ]
  },
  {
    id: "terrain-bonfim",
    title: "Lote Bonfim Paulista",
    slug: "lote-bonfim-paulista",
    description: "Terreno limpo em bairro tranquilo, com comercio local e facil ligacao para rodovia.",
    address: "Avenida das Palmeiras, 305",
    neighborhood: "Bonfim Paulista",
    city: "Ribeirao Preto",
    state: "SP",
    areaM2: 275,
    frontageM: 11,
    depthM: 25,
    price: 165000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1518481852452-9415b262eba4?auto=format&fit=crop&w=1200&q=80",
        altText: "Terreno residencial com vegetacao baixa"
      }
    ],
    compatibilities: [
      {
        id: "compat-bonfim-essencial",
        score: 91,
        status: "APPROVED",
        notes: "Boa sobra lateral para jardim e ventilacao.",
        project: projectMocks[2]
      }
    ]
  },
  {
    id: "terrain-faicalville",
    title: "Lote Setor Faicalville",
    slug: "lote-setor-faicalville",
    description: "Lote regular em regiao consolidada, perto de servicos e corredores de transporte.",
    address: "Rua F-12, Quadra 8",
    neighborhood: "Setor Faicalville",
    city: "Goiania",
    state: "GO",
    areaM2: 360,
    frontageM: 12,
    depthM: 30,
    price: 220000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
        altText: "Rua residencial arborizada"
      }
    ],
    compatibilities: [
      {
        id: "compat-faicalville-essencial",
        score: 92,
        status: "APPROVED",
        notes: "Frente de 12m permite casa simples com garagem frontal.",
        project: projectMocks[2]
      },
      {
        id: "compat-faicalville-linear",
        score: 87,
        status: "APPROVED",
        notes: "Tambem comporta o projeto linear com patio.",
        project: projectMocks[1]
      }
    ]
  },
  {
    id: "terrain-santa-monica",
    title: "Terreno Santa Monica",
    slug: "terreno-santa-monica",
    description: "Lote plano com documentacao regular e bom acesso a universidades e comercio.",
    address: "Rua Inglaterra, 77",
    neighborhood: "Santa Monica",
    city: "Uberlandia",
    state: "MG",
    areaM2: 250,
    frontageM: 10,
    depthM: 25,
    price: 155000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
        altText: "Frente de bairro residencial"
      }
    ],
    compatibilities: [
      {
        id: "compat-santa-monica-essencial",
        score: 93,
        status: "APPROVED",
        notes: "Casa terrea encaixa com boa area livre no fundo.",
        project: projectMocks[2]
      }
    ]
  },
  {
    id: "terrain-vila-nova",
    title: "Lote Vila Nova",
    slug: "lote-vila-nova",
    description: "Terreno em rua calma, com infraestrutura completa e boa orientacao solar.",
    address: "Rua XV de Novembro, 920",
    neighborhood: "Vila Nova",
    city: "Joinville",
    state: "SC",
    areaM2: 300,
    frontageM: 12,
    depthM: 25,
    price: 190000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        altText: "Casa e terreno em area verde"
      }
    ],
    compatibilities: [
      {
        id: "compat-vila-nova-essencial",
        score: 90,
        status: "APPROVED",
        notes: "Lote comporta projeto com garagem frontal.",
        project: projectMocks[2]
      },
      {
        id: "compat-vila-nova-linear",
        score: 86,
        status: "APPROVED",
        notes: "Medidas tambem atendem o projeto linear.",
        project: projectMocks[1]
      }
    ]
  },
  {
    id: "terrain-santa-candida",
    title: "Terreno Santa Candida",
    slug: "terreno-santa-candida",
    description: "Lote urbano com leve declive, perto de linhas de onibus e parques de bairro.",
    address: "Rua Theodoro Makiolka, 540",
    neighborhood: "Santa Candida",
    city: "Curitiba",
    state: "PR",
    areaM2: 240,
    frontageM: 8,
    depthM: 30,
    price: 175000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=1200&q=80",
        altText: "Terreno em area urbana"
      }
    ],
    compatibilities: [
      {
        id: "compat-santa-candida-essencial",
        score: 89,
        status: "APPROVED",
        notes: "Projeto estreito favorece lote de 8m.",
        project: projectMocks[2]
      }
    ]
  },
  {
    id: "terrain-piata",
    title: "Lote Piata",
    slug: "lote-piata",
    description: "Terreno regular a poucos minutos da orla, com potencial para casa compacta.",
    address: "Rua Ilha Azul, 64",
    neighborhood: "Piata",
    city: "Salvador",
    state: "BA",
    areaM2: 200,
    frontageM: 10,
    depthM: 20,
    price: 135000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
        altText: "Terreno aberto em dia claro"
      }
    ],
    compatibilities: [
      {
        id: "compat-piata-essencial",
        score: 88,
        status: "APPROVED",
        notes: "Boa opcao para planta compacta de dois quartos.",
        project: projectMocks[2]
      }
    ]
  },
  {
    id: "terrain-varzea",
    title: "Terreno Varzea",
    slug: "terreno-varzea",
    description: "Lote em bairro residencial com servicos proximos e bom custo de entrada.",
    address: "Rua Academico Helio Ramos, 214",
    neighborhood: "Varzea",
    city: "Recife",
    state: "PE",
    areaM2: 220,
    frontageM: 10,
    depthM: 22,
    price: 125000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80",
        altText: "Rua residencial com vegetacao"
      }
    ],
    compatibilities: [
      {
        id: "compat-varzea-essencial",
        score: 86,
        status: "APPROVED",
        notes: "Projeto menor mantem bom recuo frontal.",
        project: projectMocks[2]
      }
    ]
  },
  {
    id: "terrain-messejana",
    title: "Lote Messejana",
    slug: "lote-messejana",
    description: "Terreno plano em loteamento com ruas abertas e infraestrutura essencial.",
    address: "Rua Padre Pedro de Alencar, 460",
    neighborhood: "Messejana",
    city: "Fortaleza",
    state: "CE",
    areaM2: 180,
    frontageM: 9,
    depthM: 20,
    price: 95000,
    status: "AVAILABLE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
        altText: "Terreno proximo a area verde"
      }
    ],
    compatibilities: [
      {
        id: "compat-messejana-essencial",
        score: 84,
        status: "APPROVED",
        notes: "Casa compacta cabe com area livre posterior.",
        project: projectMocks[2]
      }
    ]
  }
];
