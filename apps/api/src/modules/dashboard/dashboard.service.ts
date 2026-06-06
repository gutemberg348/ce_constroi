import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        architectProfile: {
          select: {
            id: true,
            companyName: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const [
      favorites,
      favoritesTotal,
      simulations,
      simulationsTotal,
      orders,
      ordersTotal,
      notifications,
      notificationsTotal,
      visits,
      ownedTerrains,
      ownedTerrainsTotal,
      pendingOwnedTerrains,
      availableOwnedTerrains,
      architectProjects,
      architectProjectsTotal
    ] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          terrain: {
            include: {
              images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1 }
            }
          },
          project: {
            include: {
              architect: { include: { user: { select: { id: true, name: true } } } },
              images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1 }
            }
          }
        }
      }),
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.simulation.findMany({
        where: { customerId: userId, deletedAt: null },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          terrain: { select: { id: true, title: true, city: true, state: true } },
          project: { select: { id: true, title: true } }
        }
      }),
      this.prisma.simulation.count({ where: { customerId: userId, deletedAt: null } }),
      this.prisma.order.findMany({
        where: { customerId: userId, deletedAt: null },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          terrain: { select: { id: true, title: true, city: true, state: true } },
          project: { select: { id: true, title: true } },
          payments: { where: { deletedAt: null }, take: 2 },
          contract: true
        }
      }),
      this.prisma.order.count({ where: { customerId: userId, deletedAt: null } }),
      this.prisma.notification.findMany({
        where: { userId, deletedAt: null },
        take: 8,
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.notification.count({ where: { userId, deletedAt: null } }),
      this.prisma.siteEvent.count({ where: { userId } }),
      user.role === UserRole.TERRAIN_OWNER || user.role === UserRole.ADMIN
        ? this.prisma.terrain.findMany({
            where: { ownerId: userId, deletedAt: null },
            take: 12,
            orderBy: { createdAt: "desc" },
            include: {
              images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1 },
              _count: { select: { simulations: true, orders: true, favorites: true } }
            }
          })
        : Promise.resolve([]),
      user.role === UserRole.TERRAIN_OWNER || user.role === UserRole.ADMIN
        ? this.prisma.terrain.count({ where: { ownerId: userId, deletedAt: null } })
        : Promise.resolve(0),
      user.role === UserRole.TERRAIN_OWNER || user.role === UserRole.ADMIN
        ? this.prisma.terrain.count({ where: { ownerId: userId, status: "PENDING_REVIEW", deletedAt: null } })
        : Promise.resolve(0),
      user.role === UserRole.TERRAIN_OWNER || user.role === UserRole.ADMIN
        ? this.prisma.terrain.count({ where: { ownerId: userId, status: "AVAILABLE", deletedAt: null } })
        : Promise.resolve(0),
      user.architectProfile
        ? this.prisma.project.findMany({
            where: { architectId: user.architectProfile.id, deletedAt: null },
            take: 12,
            orderBy: { createdAt: "desc" },
            include: {
              images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 1 },
              _count: { select: { simulations: true, orders: true, favorites: true } }
            }
          })
        : Promise.resolve([]),
      user.architectProfile
        ? this.prisma.project.count({ where: { architectId: user.architectProfile.id, deletedAt: null } })
        : Promise.resolve(0)
    ]);

    return {
      user,
      metrics: {
        favorites: favoritesTotal,
        simulations: simulationsTotal,
        orders: ordersTotal,
        notifications: notificationsTotal,
        visits,
        ownedTerrains: ownedTerrainsTotal,
        pendingOwnedTerrains,
        availableOwnedTerrains,
        architectProjects: architectProjectsTotal
      },
      favorites,
      simulations,
      orders,
      notifications,
      ownedTerrains,
      architectProjects
    };
  }
}
