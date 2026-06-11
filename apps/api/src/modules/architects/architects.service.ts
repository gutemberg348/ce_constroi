import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma/prisma.service";
import { UpdateArchitectProfileDto } from "./dto/update-architect-profile.dto";

@Injectable()
export class ArchitectsService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const architect = await this.prisma.architect.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        projects: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            images: { where: { deletedAt: null }, take: 1 },
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
            }
          }
        }
      }
    });

    if (!architect) {
      throw new NotFoundException("Architect profile not found");
    }

    return architect;
  }

  async updateMe(userId: string, dto: UpdateArchitectProfileDto) {
    const architect = await this.me(userId);
    return this.prisma.architect.update({
      where: { id: architect.id },
      data: dto
    });
  }

  async stats(userId: string) {
    const architect = await this.me(userId);
    const [projects, publishedProjects, paidOrders] = await this.prisma.$transaction([
      this.prisma.project.count({ where: { architectId: architect.id, deletedAt: null } }),
      this.prisma.project.count({
        where: { architectId: architect.id, status: "PUBLISHED", deletedAt: null }
      }),
      this.prisma.order.count({
        where: {
          status: "PAID",
          project: { architectId: architect.id }
        }
      })
    ]);

    return {
      projects,
      publishedProjects,
      paidOrders,
      conversionRate: projects ? Number((paidOrders / projects).toFixed(2)) : 0
    };
  }
}
