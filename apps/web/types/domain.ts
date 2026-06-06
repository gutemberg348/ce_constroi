export type UserRole = "ADMIN" | "ARCHITECT" | "CUSTOMER" | "TERRAIN_OWNER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type ArchitectStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type TerrainStatus = "DRAFT" | "PENDING_REVIEW" | "AVAILABLE" | "RESERVED" | "SOLD" | "ARCHIVED";
export type ProjectStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
export type SimulationStatus = "DRAFT" | "SENT" | "CONVERTED" | "EXPIRED";
export type OrderStatus = "DRAFT" | "PENDING_PAYMENT" | "PAID" | "CANCELED" | "REFUNDED";

export type ApiResponse<T> = {
  success: boolean;
  requestId?: string;
  data: T;
};

export type SiteSettings = {
  brandName: string;
  logoUrl?: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
};

export type Paginated<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Terrain = {
  id: string;
  title: string;
  slug: string;
  description: string;
  address?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  areaM2: number | string;
  frontageM?: number | string;
  depthM?: number | string;
  price: number | string;
  zoning?: string;
  status: string;
  metadata?: Record<string, unknown>;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  _count?: {
    compatibilities?: number;
    simulations?: number;
    orders?: number;
    favorites?: number;
  };
  images?: AssetImage[];
  compatibilities?: Array<{
    id: string;
    score: number | string;
    status: string;
    notes?: string;
    project: Project;
  }>;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  suites?: number;
  parkingSpaces?: number;
  floors?: number;
  areaM2: number | string;
  minFrontageM?: number | string;
  minDepthM?: number | string;
  estimatedBuildCost: number | string;
  price: number | string;
  status?: ProjectStatus;
  style?: string;
  renderUrl?: string;
  floorPlanUrl?: string;
  images?: AssetImage[];
  architect?: {
    id?: string;
    status?: ArchitectStatus;
    companyName?: string;
    user?: {
      id?: string;
      name: string;
      email?: string;
      phone?: string;
    };
  };
  _count?: {
    compatibilities?: number;
    simulations?: number;
    orders?: number;
    favorites?: number;
  };
  compatibilities?: Array<{
    id: string;
    score: number | string;
    status: string;
    notes?: string;
    terrain: Terrain;
  }>;
};

export type AssetImage = {
  id?: string;
  url: string;
  storageKey?: string;
  altText?: string;
  sortOrder?: number;
  isCover?: boolean;
};

export type Favorite = {
  id: string;
  userId: string;
  terrainId?: string | null;
  projectId?: string | null;
  terrain?: Terrain | null;
  project?: Project | null;
  createdAt: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  avatarUrl?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type AdminMetrics = {
  users: number;
  architects: number;
  pendingArchitects: number;
  terrainOwners: number;
  terrains: number;
  pendingTerrains: number;
  projects: number;
  pendingProjects: number;
  simulations: number;
  orders: number;
  paidOrders: number;
  grossMerchandiseValue: number | string;
  siteEvents: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  architectProfile?: {
    id: string;
    companyName?: string;
    bio?: string;
    status: ArchitectStatus;
    cauNumber?: string;
    website?: string;
    rejectionReason?: string;
  } | null;
  _count?: {
    ownedTerrains: number;
    simulations: number;
    orders: number;
    favorites: number;
    siteEvents: number;
  };
};

export type AdminSimulation = {
  id: string;
  terrainPrice: number | string;
  projectPrice: number | string;
  estimatedBuildCost: number | string;
  downPayment: number | string;
  monthlyPayment: number | string;
  totalAmount: number | string;
  status: SimulationStatus;
  createdAt: string;
  customer?: Pick<AdminUser, "id" | "name" | "email" | "phone"> | null;
  terrain?: Pick<Terrain, "id" | "title" | "city" | "state"> | null;
  project?: Pick<Project, "id" | "title"> | null;
  orders?: AdminOrder[];
};

export type AdminOrder = {
  id: string;
  subtotal?: number | string;
  total: number | string;
  status: OrderStatus;
  createdAt: string;
  customer: Pick<AdminUser, "id" | "name" | "email" | "phone">;
  terrain?: Pick<Terrain, "id" | "title" | "city" | "state"> | null;
  project?: Pick<Project, "id" | "title"> | null;
  simulation?: Pick<AdminSimulation, "id" | "status"> | null;
};

export type SiteEvent = {
  id: string;
  userId?: string | null;
  type: string;
  path: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: Pick<AdminUser, "id" | "name" | "email" | "role"> | null;
};

export type AdminOverview = {
  terrainQueue: Array<
    Terrain & {
      owner?: {
        id: string;
        name: string;
        email: string;
        phone?: string;
      } | null;
    }
  >;
  recentSimulations: Array<{
    id: string;
    terrainPrice: number | string;
    projectPrice: number | string;
    estimatedBuildCost: number | string;
    downPayment: number | string;
    monthlyPayment: number | string;
    totalAmount: number | string;
    status: string;
    createdAt: string;
    customer?: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    } | null;
    terrain?: Pick<Terrain, "id" | "title" | "city" | "state"> | null;
    project?: Pick<Project, "id" | "title"> | null;
  }>;
  recentOrders: Array<{
    id: string;
    total: number | string;
    status: string;
    createdAt: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    terrain?: Pick<Terrain, "id" | "title"> | null;
    project?: Pick<Project, "id" | "title"> | null;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    status: string;
    createdAt: string;
  }>;
  projectQueue: Project[];
  recentEvents: SiteEvent[];
};

export type UserDashboard = {
  user: AuthUser & {
    createdAt?: string;
    architectProfile?: {
      id: string;
      companyName?: string;
      status: ArchitectStatus;
    } | null;
  };
  metrics: {
    favorites: number;
    simulations: number;
    orders: number;
    notifications: number;
    visits: number;
    ownedTerrains: number;
    pendingOwnedTerrains: number;
    availableOwnedTerrains: number;
    architectProjects: number;
  };
  favorites: Favorite[];
  simulations: AdminSimulation[];
  orders: AdminOrder[];
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    readAt?: string | null;
    createdAt: string;
  }>;
  ownedTerrains: Terrain[];
  architectProjects: Project[];
};

export type ArchitectProfile = {
  id: string;
  status: ArchitectStatus;
  companyName?: string;
  bio?: string;
  cauNumber?: string;
  website?: string;
  rejectionReason?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status?: string;
    createdAt?: string;
  };
  _count?: {
    projects: number;
  };
  projects?: Project[];
};
