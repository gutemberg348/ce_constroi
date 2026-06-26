import * as bcrypt from "bcrypt";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ArchitectStatus,
  NotificationType,
  OrderStatus,
  ProjectStatus,
  SimulationStatus,
  TerrainStatus,
  UserRole,
  UserStatus
} from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { PrismaService } from "@/database/prisma/prisma.service";
import { getPagination, PaginatedResult } from "@/common/pagination/pagination.dto";
import { CreateProjectImageDto } from "@/modules/project-images/dto/create-project-image.dto";
import { CreateTerrainImageDto } from "@/modules/terrain-images/dto/create-terrain-image.dto";
import { UpdateProjectDto } from "@/modules/projects/dto/update-project.dto";
import { UpdateTerrainDto } from "@/modules/terrains/dto/update-terrain.dto";
import { CreateAdminArchitectDto } from "./dto/create-admin-architect.dto";
import { ListArchitectsDto } from "./dto/list-architects.dto";
import { ListAdminResourcesDto } from "./dto/list-admin-resources.dto";
import { RejectArchitectDto } from "./dto/reject-architect.dto";
import { UpdateAdminArchitectDto } from "./dto/update-admin-architect.dto";
import { UpdateAdminUserDto } from "./dto/update-admin-user.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics() {
    const [
      users,
      customers,
      architects,
      pendingArchitects,
      terrainOwners,
      terrains,
      pendingTerrains,
      projects,
      pendingProjects,
      simulations,
      orders,
      paidOrders,
      revenue,
      siteEvents
    ] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { role: UserRole.CUSTOMER, deletedAt: null } }),
        this.prisma.architect.count({ where: { deletedAt: null } }),
        this.prisma.architect.count({
          where: { status: ArchitectStatus.PENDING_REVIEW, deletedAt: null }
        }),
        this.prisma.user.count({ where: { role: UserRole.TERRAIN_OWNER, deletedAt: null } }),
        this.prisma.terrain.count({ where: { deletedAt: null } }),
        this.prisma.terrain.count({ where: { status: TerrainStatus.PENDING_REVIEW, deletedAt: null } }),
        this.prisma.project.count({ where: { deletedAt: null } }),
        this.prisma.project.count({ where: { status: ProjectStatus.PENDING_REVIEW, deletedAt: null } }),
        this.prisma.simulation.count({ where: { deletedAt: null } }),
        this.prisma.order.count({ where: this.convertedLeadOrderWhere() }),
        this.prisma.order.count({ where: this.convertedLeadOrderWhere({ status: OrderStatus.PAID }) }),
        this.prisma.order.aggregate({
          where: this.convertedLeadOrderWhere({ status: OrderStatus.PAID }),
          _sum: { total: true }
        }),
        this.prisma.siteEvent.count()
      ]);

    return {
      users,
      customers,
      architects,
      pendingArchitects,
      terrainOwners,
      terrains,
      pendingTerrains,
      projects,
      pendingProjects,
      simulations,
      orders,
      paidOrders,
      grossMerchandiseValue: revenue._sum.total ?? 0,
      siteEvents
    };
  }

  async overview() {
    const [terrainQueue, recentSimulations, recentOrders, recentUsers, projectQueue, recentEvents] =
      await this.prisma.$transaction([
        this.prisma.terrain.findMany({
          where: {
            deletedAt: null,
            status: { in: [TerrainStatus.PENDING_REVIEW, TerrainStatus.DRAFT] }
          },
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            owner: { select: { id: true, name: true, email: true, phone: true } },
            images: {
              where: { deletedAt: null },
              orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
              take: 6
            }
          }
        }),
        this.prisma.simulation.findMany({
          where: { deletedAt: null },
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            terrain: { select: { id: true, title: true, city: true, state: true } },
            project: { select: { id: true, title: true } }
          }
        }),
        this.prisma.order.findMany({
          where: this.convertedLeadOrderWhere(),
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            terrain: { select: { id: true, title: true } },
            project: { select: { id: true, title: true } },
            simulation: { select: { id: true, status: true } }
          }
        }),
        this.prisma.user.findMany({
          where: { deletedAt: null },
          take: 8,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true
          }
        }),
        this.prisma.project.findMany({
          where: {
            deletedAt: null,
            status: ProjectStatus.PENDING_REVIEW
          },
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            architect: { include: { user: { select: { id: true, name: true, email: true } } } },
            images: {
              where: { deletedAt: null },
              orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
              take: 6
            }
          }
        }),
        this.prisma.siteEvent.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } }
          }
        })
      ]);

    return {
      terrainQueue,
      recentSimulations,
      recentOrders,
      recentUsers,
      projectQueue,
      recentEvents
    };
  }

  async listUsers(query: ListAdminResourcesDto) {
    const pagination = getPagination(query);
    const role = query.role ? this.enumValue(UserRole, query.role, "role") : undefined;
    const status = query.status ? this.enumValue(UserStatus, query.status, "status") : undefined;
    const where = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" as const } },
              { email: { contains: query.search, mode: "insensitive" as const } },
              { phone: { contains: query.search, mode: "insensitive" as const } },
              { document: { contains: query.search, mode: "insensitive" as const } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          document: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          architectProfile: {
            select: {
              id: true,
              companyName: true,
              bio: true,
              status: true,
              cauNumber: true,
              website: true,
              rejectionReason: true
            }
          },
          _count: {
            select: {
              ownedTerrains: true,
              simulations: true,
              orders: true,
              favorites: true,
              siteEvents: true
            }
          }
        }
      }),
      this.prisma.user.count({ where })
    ]);

    return this.paginated(items, total, pagination.page, pagination.limit);
  }

  async updateUserStatus(userId: string, statusInput: string) {
    const status = this.enumValue(UserStatus, statusInput, "status");
    await this.findUserOrFail(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status,
        ...(status === UserStatus.ACTIVE ? {} : { refreshTokenHash: null })
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async updateUser(userId: string, dto: UpdateAdminUserDto) {
    await this.findUserOrFail(userId);
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : undefined;

    const data: Prisma.UserUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
      ...(dto.phone !== undefined ? { phone: this.emptyToNull(dto.phone) } : {}),
      ...(dto.document !== undefined ? { document: this.emptyToNull(dto.document) } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.status && dto.status !== UserStatus.ACTIVE ? { refreshTokenHash: null } : {}),
      ...(passwordHash ? { passwordHash, refreshTokenHash: null } : {})
    };

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        document: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        architectProfile: {
          select: {
            id: true,
            companyName: true,
            bio: true,
            status: true,
            cauNumber: true,
            website: true,
            rejectionReason: true
          }
        },
        _count: {
          select: {
            ownedTerrains: true,
            simulations: true,
            orders: true,
            favorites: true,
            siteEvents: true
          }
        }
      }
    });
  }

  async removeUser(userId: string, adminId: string) {
    await this.findUserOrFail(userId);

    if (userId === adminId) {
      throw new BadRequestException("Admin cannot remove itself");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        document: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        architectProfile: {
          select: {
            id: true,
            companyName: true,
            bio: true,
            status: true,
            cauNumber: true,
            website: true,
            rejectionReason: true
          }
        },
        _count: {
          select: {
            ownedTerrains: true,
            simulations: true,
            orders: true,
            favorites: true,
            siteEvents: true
          }
        }
      }
    });
  }

  async listTerrains(query: ListAdminResourcesDto) {
    const pagination = getPagination(query);
    const status = query.status ? this.enumValue(TerrainStatus, query.status, "status") : undefined;
    const where = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" as const } },
              { description: { contains: query.search, mode: "insensitive" as const } },
              { address: { contains: query.search, mode: "insensitive" as const } },
              { neighborhood: { contains: query.search, mode: "insensitive" as const } },
              { city: { contains: query.search, mode: "insensitive" as const } },
              { state: { contains: query.search, mode: "insensitive" as const } },
              {
                condominium: {
                  is: {
                    OR: [
                      { name: { contains: query.search, mode: "insensitive" as const } },
                      { address: { contains: query.search, mode: "insensitive" as const } },
                      { neighborhood: { contains: query.search, mode: "insensitive" as const } },
                      { city: { contains: query.search, mode: "insensitive" as const } }
                    ]
                  }
                }
              }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.terrain.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { id: true, name: true, email: true, phone: true } },
          images: {
            where: { deletedAt: null },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
            take: 6
          },
          condominium: {
            include: {
              images: {
                where: { deletedAt: null },
                orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
                take: 10
              }
            }
          },
          _count: {
            select: {
              compatibilities: true,
              simulations: true,
              orders: true,
              favorites: true
            }
          }
        }
      }),
      this.prisma.terrain.count({ where })
    ]);

    return this.paginated(items, total, pagination.page, pagination.limit);
  }

  async updateTerrainStatus(terrainId: string, adminId: string, statusInput: string) {
    const status = this.enumValue(TerrainStatus, statusInput, "status");
    const terrain = await this.findTerrainOrFail(terrainId);

    const updated = await this.prisma.terrain.update({
      where: { id: terrain.id },
      data: {
        status,
        metadata: this.withReviewMetadata(terrain.metadata, adminId, status)
      },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 6 }
      }
    });

    if (terrain.ownerId) {
      await this.prisma.notification.create({
        data: {
          userId: terrain.ownerId,
          type: NotificationType.SYSTEM,
          title: "Status do terreno atualizado",
          body: `Seu anuncio agora esta com status ${status}.`
        }
      });
    }

    return updated;
  }

  async updateTerrain(terrainId: string, dto: UpdateTerrainDto) {
    await this.findTerrainOrFail(terrainId);
    const { metadata, condominiumId, ...data } = dto;

    return this.prisma.terrain.update({
      where: { id: terrainId },
      data: {
        ...data,
        ...(condominiumId !== undefined
          ? { condominium: condominiumId ? { connect: { id: condominiumId } } : { disconnect: true } }
          : {}),
        ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {})
      },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 6
        },
        condominium: {
          include: {
            images: {
              where: { deletedAt: null },
              orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
              take: 10
            }
          }
        },
        _count: {
          select: {
            compatibilities: true,
            simulations: true,
            orders: true,
            favorites: true
          }
        }
      }
    });
  }

  async removeTerrain(terrainId: string, adminId: string) {
    const terrain = await this.findTerrainOrFail(terrainId);

    return this.prisma.terrain.update({
      where: { id: terrain.id },
      data: {
        deletedAt: new Date(),
        status: TerrainStatus.ARCHIVED,
        metadata: this.withReviewMetadata(terrain.metadata, adminId, "DELETED")
      },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 6
        },
        condominium: {
          include: {
            images: {
              where: { deletedAt: null },
              orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
              take: 10
            }
          }
        },
        _count: {
          select: {
            compatibilities: true,
            simulations: true,
            orders: true,
            favorites: true
          }
        }
      }
    });
  }

  async addTerrainImage(terrainId: string, dto: CreateTerrainImageDto) {
    await this.findTerrainOrFail(terrainId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCover) {
        await tx.terrainImage.updateMany({
          where: { terrainId, deletedAt: null },
          data: { isCover: false }
        });
      }

      return tx.terrainImage.create({
        data: {
          terrainId,
          url: dto.url,
          storageKey: dto.storageKey || dto.url,
          altText: dto.altText,
          sortOrder: dto.sortOrder ?? 0,
          isCover: dto.isCover ?? false
        }
      });
    });
  }

  async removeTerrainImage(imageId: string) {
    const image = await this.prisma.terrainImage.findFirst({
      where: { id: imageId, deletedAt: null }
    });

    if (!image) {
      throw new NotFoundException("Terrain image not found");
    }

    return this.prisma.terrainImage.update({
      where: { id: image.id },
      data: { deletedAt: new Date() }
    });
  }

  async listProjects(query: ListAdminResourcesDto) {
    const pagination = getPagination(query);
    const status = query.status ? this.enumValue(ProjectStatus, query.status, "status") : undefined;
    const where = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" as const } },
              { description: { contains: query.search, mode: "insensitive" as const } },
              { style: { contains: query.search, mode: "insensitive" as const } },
              { architect: { user: { name: { contains: query.search, mode: "insensitive" as const } } } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          architect: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } }
            }
          },
          images: {
            where: { deletedAt: null },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
            take: 6
          },
          compatibilities: {
            where: { deletedAt: null },
            orderBy: { score: "desc" },
            take: 12,
            include: {
              terrain: {
                include: {
                  images: {
                    where: { deletedAt: null },
                    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
                    take: 1
                  }
                }
              }
            }
          },
          _count: {
            select: {
              compatibilities: true,
              simulations: true,
              orders: true,
              favorites: true
            }
          }
        }
      }),
      this.prisma.project.count({ where })
    ]);

    return this.paginated(items, total, pagination.page, pagination.limit);
  }

  async updateProjectStatus(projectId: string, statusInput: string) {
    const status = this.enumValue(ProjectStatus, statusInput, "status");
    await this.findProjectOrFail(projectId);

    return this.prisma.project.update({
      where: { id: projectId },
      data: { status },
      include: {
        architect: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 6 }
      }
    });
  }

  async updateProject(projectId: string, dto: UpdateProjectDto) {
    await this.findProjectOrFail(projectId);
    const { architectId, ...data } = dto;

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...data,
        ...(architectId ? { architect: { connect: { id: architectId } } } : {})
      },
      include: {
        architect: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 6
        },
        _count: {
          select: {
            compatibilities: true,
            simulations: true,
            orders: true,
            favorites: true
          }
        }
      }
    });
  }

  async removeProject(projectId: string) {
    await this.findProjectOrFail(projectId);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        deletedAt: new Date(),
        status: ProjectStatus.ARCHIVED
      },
      include: {
        architect: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } }
          }
        },
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 6
        },
        _count: {
          select: {
            compatibilities: true,
            simulations: true,
            orders: true,
            favorites: true
          }
        }
      }
    });
  }

  async addProjectImage(projectId: string, dto: CreateProjectImageDto) {
    await this.findProjectOrFail(projectId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCover) {
        await tx.projectImage.updateMany({
          where: { projectId, deletedAt: null },
          data: { isCover: false }
        });
      }

      return tx.projectImage.create({
        data: {
          projectId,
          url: dto.url,
          storageKey: dto.storageKey || dto.url,
          altText: dto.altText,
          sortOrder: dto.sortOrder ?? 0,
          isCover: dto.isCover ?? false
        }
      });
    });
  }

  async removeProjectImage(imageId: string) {
    const image = await this.prisma.projectImage.findFirst({
      where: { id: imageId, deletedAt: null }
    });

    if (!image) {
      throw new NotFoundException("Project image not found");
    }

    return this.prisma.projectImage.update({
      where: { id: image.id },
      data: { deletedAt: new Date() }
    });
  }

  async listSimulations(query: ListAdminResourcesDto) {
    const pagination = getPagination(query);
    const status = query.status ? this.enumValue(SimulationStatus, query.status, "status") : undefined;
    const where = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { customer: { name: { contains: query.search, mode: "insensitive" as const } } },
              { customer: { email: { contains: query.search, mode: "insensitive" as const } } },
              { terrain: { title: { contains: query.search, mode: "insensitive" as const } } },
              { project: { title: { contains: query.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.simulation.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          terrain: { select: { id: true, title: true, city: true, state: true } },
          project: { select: { id: true, title: true } },
          orders: { where: { deletedAt: null }, take: 3 }
        }
      }),
      this.prisma.simulation.count({ where })
    ]);

    return this.paginated(items, total, pagination.page, pagination.limit);
  }

  async updateSimulationStatus(simulationId: string, statusInput: string) {
    const status = this.enumValue(SimulationStatus, statusInput, "status");
    const simulation = await this.findSimulationOrFail(simulationId);

    if (status === SimulationStatus.CONVERTED && !simulation.customerId) {
      throw new BadRequestException("A simulacao precisa ter cliente vinculado para virar pedido.");
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedSimulation = await tx.simulation.update({
        where: { id: simulationId },
        data: { status },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          terrain: { select: { id: true, title: true, city: true, state: true } },
          project: { select: { id: true, title: true } },
          orders: { where: { deletedAt: null }, take: 3 }
        }
      });

      if (status === SimulationStatus.CONVERTED) {
        const existingOrder = await tx.order.findFirst({
          where: { simulationId, deletedAt: null }
        });

        if (!existingOrder) {
          await tx.order.create({
            data: {
              customerId: simulation.customerId as string,
              terrainId: simulation.terrainId,
              projectId: simulation.projectId,
              simulationId,
              subtotal: simulation.totalAmount,
              fees: 0,
              total: simulation.totalAmount,
              status: OrderStatus.PENDING_PAYMENT
            }
          });
        }
      }

      return updatedSimulation;
    });
  }

  async removeSimulation(simulationId: string) {
    await this.findSimulationOrFail(simulationId);

    return this.prisma.simulation.update({
      where: { id: simulationId },
      data: { deletedAt: new Date() },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        terrain: { select: { id: true, title: true, city: true, state: true } },
        project: { select: { id: true, title: true } }
      }
    });
  }

  async listOrders(query: ListAdminResourcesDto) {
    const pagination = getPagination(query);
    const status = query.status ? this.enumValue(OrderStatus, query.status, "status") : undefined;
    const where = this.convertedLeadOrderWhere({
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { customer: { name: { contains: query.search, mode: "insensitive" as const } } },
              { customer: { email: { contains: query.search, mode: "insensitive" as const } } },
              { terrain: { title: { contains: query.search, mode: "insensitive" as const } } },
              { project: { title: { contains: query.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    });

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          terrain: { select: { id: true, title: true, city: true, state: true } },
          project: { select: { id: true, title: true } },
          simulation: { select: { id: true, status: true } },
          payments: { where: { deletedAt: null }, take: 3 },
          contract: true
        }
      }),
      this.prisma.order.count({ where })
    ]);

    return this.paginated(items, total, pagination.page, pagination.limit);
  }

  async updateOrderStatus(orderId: string, statusInput: string) {
    const status = this.enumValue(OrderStatus, statusInput, "status");
    await this.findOrderOrFail(orderId);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        terrain: { select: { id: true, title: true, city: true, state: true } },
        project: { select: { id: true, title: true } }
      }
    });
  }

  async listEvents(query: ListAdminResourcesDto) {
    const pagination = getPagination(query);
    const where = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? {
            OR: [
              { path: { contains: query.search, mode: "insensitive" as const } },
              { type: { contains: query.search, mode: "insensitive" as const } },
              { user: { name: { contains: query.search, mode: "insensitive" as const } } },
              { user: { email: { contains: query.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.siteEvent.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        }
      }),
      this.prisma.siteEvent.count({ where })
    ]);

    return this.paginated(items, total, pagination.page, pagination.limit);
  }

  listArchitects(query: ListArchitectsDto) {
    return this.prisma.architect.findMany({
      where: {
        deletedAt: null,
        ...(query.status ? { status: query.status } : {})
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: { projects: true }
        }
      }
    });
  }

  async createArchitect(dto: CreateAdminArchitectDto, adminId: string) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();
    const companyName = this.emptyToNull(dto.companyName ?? "") ?? name;
    const cauNumber = this.emptyToNull(dto.cauNumber ?? "");
    const status = dto.status ?? ArchitectStatus.APPROVED;
    const reviewed = status !== ArchitectStatus.PENDING_REVIEW;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      throw new BadRequestException("Este e-mail já está cadastrado.");
    }

    if (cauNumber) {
      const existingCau = await this.prisma.architect.findFirst({
        where: { cauNumber },
        select: { id: true }
      });

      if (existingCau) {
        throw new BadRequestException("Este número de CAU já está cadastrado.");
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: UserRole.ARCHITECT,
          status: UserStatus.ACTIVE,
          phone: this.emptyToNull(dto.phone ?? "")
        }
      });

      const architect = await tx.architect.create({
        data: {
          userId: user.id,
          companyName,
          cauNumber,
          website: this.emptyToNull(dto.website ?? ""),
          bio: this.emptyToNull(dto.bio ?? ""),
          status,
          reviewedAt: reviewed ? new Date() : undefined,
          reviewedById: reviewed ? adminId : undefined,
          rejectionReason: status === ArchitectStatus.REJECTED ? "Cadastro criado como recusado pela administracao." : null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              createdAt: true
            }
          },
          _count: {
            select: { projects: true }
          }
        }
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SYSTEM,
          title: "Acesso de arquiteto criado",
          body:
            status === ArchitectStatus.APPROVED
              ? "Seu acesso de arquiteto ja esta aprovado para publicar projetos."
              : "Seu acesso de arquiteto foi criado pela administracao."
        }
      });

      return architect;
    });
  }

  async updateArchitect(architectId: string, adminId: string, dto: UpdateAdminArchitectDto) {
    await this.findArchitectOrFail(architectId);
    const status = dto.status;

    const data: Prisma.ArchitectUpdateInput = {
      ...(dto.companyName !== undefined ? { companyName: this.emptyToNull(dto.companyName) } : {}),
      ...(dto.bio !== undefined ? { bio: this.emptyToNull(dto.bio) } : {}),
      ...(dto.cauNumber !== undefined ? { cauNumber: this.emptyToNull(dto.cauNumber) } : {}),
      ...(dto.website !== undefined ? { website: this.emptyToNull(dto.website) } : {}),
      ...(dto.rejectionReason !== undefined ? { rejectionReason: this.emptyToNull(dto.rejectionReason) } : {}),
      ...(status !== undefined
        ? {
            status,
            reviewedAt: new Date(),
            reviewedById: adminId,
            ...(status === ArchitectStatus.APPROVED ? { rejectionReason: null } : {})
          }
        : {})
    };

    return this.prisma.architect.update({
      where: { id: architectId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: { projects: true }
        }
      }
    });
  }

  async removeArchitect(architectId: string) {
    const architect = await this.findArchitectOrFail(architectId);

    return this.prisma.architect.update({
      where: { id: architect.id },
      data: {
        deletedAt: new Date(),
        status: ArchitectStatus.SUSPENDED
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: { projects: true }
        }
      }
    });
  }

  async approveArchitect(architectId: string, adminId: string) {
    const architect = await this.findArchitectOrFail(architectId);

    const approved = await this.prisma.architect.update({
      where: { id: architect.id },
      data: {
        status: ArchitectStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedById: adminId,
        rejectionReason: null
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await this.prisma.notification.create({
      data: {
        userId: architect.userId,
        type: NotificationType.SYSTEM,
        title: "Cadastro de arquiteto aprovado",
        body: "Seu perfil foi aprovado. Agora voce pode publicar projetos arquitetonicos."
      }
    });

    return approved;
  }

  async rejectArchitect(architectId: string, adminId: string, dto: RejectArchitectDto) {
    const architect = await this.findArchitectOrFail(architectId);

    const rejected = await this.prisma.architect.update({
      where: { id: architect.id },
      data: {
        status: ArchitectStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: adminId,
        rejectionReason: dto.reason ?? "Cadastro recusado pela administracao."
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await this.prisma.notification.create({
      data: {
        userId: architect.userId,
        type: NotificationType.SYSTEM,
        title: "Cadastro de arquiteto recusado",
        body: dto.reason ?? "Seu cadastro de arquiteto foi recusado pela administracao."
      }
    });

    return rejected;
  }

  async approveTerrain(terrainId: string, adminId: string) {
    const terrain = await this.findTerrainOrFail(terrainId);

    const approved = await this.prisma.terrain.update({
      where: { id: terrain.id },
      data: {
        status: TerrainStatus.AVAILABLE,
        metadata: {
          ...(terrain.metadata && typeof terrain.metadata === "object" && !Array.isArray(terrain.metadata)
            ? terrain.metadata
            : {}),
          reviewedAt: new Date().toISOString(),
          reviewedById: adminId,
          reviewStatus: "APPROVED"
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 6 }
      }
    });

    if (terrain.ownerId) {
      await this.prisma.notification.create({
        data: {
          userId: terrain.ownerId,
          type: NotificationType.SYSTEM,
          title: "Anuncio de terreno aprovado",
          body: "Seu terreno foi aprovado e ja pode aparecer no marketplace."
        }
      });
    }

    return approved;
  }

  async archiveTerrain(terrainId: string, adminId: string) {
    const terrain = await this.findTerrainOrFail(terrainId);

    const archived = await this.prisma.terrain.update({
      where: { id: terrain.id },
      data: {
        status: TerrainStatus.ARCHIVED,
        metadata: {
          ...(terrain.metadata && typeof terrain.metadata === "object" && !Array.isArray(terrain.metadata)
            ? terrain.metadata
            : {}),
          reviewedAt: new Date().toISOString(),
          reviewedById: adminId,
          reviewStatus: "ARCHIVED"
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 6 }
      }
    });

    if (terrain.ownerId) {
      await this.prisma.notification.create({
        data: {
          userId: terrain.ownerId,
          type: NotificationType.SYSTEM,
          title: "Anuncio de terreno arquivado",
          body: "Seu anuncio foi arquivado pela curadoria. Fale com o atendimento para ajustar os dados."
        }
      });
    }

    return archived;
  }

  private async findArchitectOrFail(architectId: string) {
    const architect = await this.prisma.architect.findFirst({
      where: { id: architectId, deletedAt: null }
    });

    if (!architect) {
      throw new NotFoundException("Architect not found");
    }

    return architect;
  }

  private async findTerrainOrFail(terrainId: string) {
    const terrain = await this.prisma.terrain.findFirst({
      where: { id: terrainId, deletedAt: null }
    });

    if (!terrain) {
      throw new NotFoundException("Terrain not found");
    }

    return terrain;
  }

  private async findUserOrFail(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  private async findProjectOrFail(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null }
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  private async findSimulationOrFail(simulationId: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: { id: simulationId, deletedAt: null }
    });

    if (!simulation) {
      throw new NotFoundException("Simulation not found");
    }

    return simulation;
  }

  private async findOrderOrFail(orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  private convertedLeadOrderWhere(extra: Prisma.OrderWhereInput = {}): Prisma.OrderWhereInput {
    return {
      deletedAt: null,
      simulationId: { not: null },
      simulation: {
        status: SimulationStatus.CONVERTED,
        deletedAt: null
      },
      ...extra
    };
  }

  private enumValue<TEnum extends Record<string, string>>(enumObject: TEnum, value: string, field: string) {
    const normalized = value.trim().toUpperCase();
    const values = Object.values(enumObject);

    if (!values.includes(normalized)) {
      throw new BadRequestException(`Invalid ${field}: ${value}`);
    }

    return normalized as TEnum[keyof TEnum];
  }

  private emptyToNull(value: string) {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private paginated<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  private withReviewMetadata(metadata: unknown, adminId: string, status: string) {
    return {
      ...(metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}),
      reviewedAt: new Date().toISOString(),
      reviewedById: adminId,
      reviewStatus: status
    };
  }
}
