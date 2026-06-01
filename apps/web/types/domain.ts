export type UserRole = "ADMIN" | "ARCHITECT" | "CUSTOMER" | "TERRAIN_OWNER";
export type ArchitectStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type ApiResponse<T> = {
  success: boolean;
  requestId?: string;
  data: T;
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
  city: string;
  state: string;
  areaM2: number | string;
  frontageM?: number | string;
  depthM?: number | string;
  price: number | string;
  status: string;
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
  areaM2: number | string;
  minFrontageM?: number | string;
  minDepthM?: number | string;
  estimatedBuildCost: number | string;
  price: number | string;
  style?: string;
  renderUrl?: string;
  floorPlanUrl?: string;
  images?: AssetImage[];
  architect?: {
    id?: string;
    status?: ArchitectStatus;
    user?: {
      name: string;
    };
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
  altText?: string;
  isCover?: boolean;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
  terrains: number;
  projects: number;
  orders: number;
  paidOrders: number;
  grossMerchandiseValue: number | string;
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
