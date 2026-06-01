import { Injectable, NotFoundException } from "@nestjs/common";
import { ArchitectStatus, NotificationType } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";
import { ListArchitectsDto } from "./dto/list-architects.dto";
import { RejectArchitectDto } from "./dto/reject-architect.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics() {
    const [users, architects, pendingArchitects, terrains, projects, orders, paidOrders, revenue] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.architect.count({ where: { deletedAt: null } }),
        this.prisma.architect.count({
          where: { status: ArchitectStatus.PENDING_REVIEW, deletedAt: null }
        }),
        this.prisma.terrain.count({ where: { deletedAt: null } }),
        this.prisma.project.count({ where: { deletedAt: null } }),
        this.prisma.order.count({ where: { deletedAt: null } }),
        this.prisma.order.count({ where: { status: "PAID", deletedAt: null } }),
        this.prisma.order.aggregate({
          where: { status: "PAID", deletedAt: null },
          _sum: { total: true }
        })
      ]);

    return {
      users,
      architects,
      pendingArchitects,
      terrains,
      projects,
      orders,
      paidOrders,
      grossMerchandiseValue: revenue._sum.total ?? 0
    };
  }

  listArchitects(query: ListArchitectsDto) {
    return this.prisma.architect.findMany({
      where: {
        deletedAt: null,
        status: query.status ?? ArchitectStatus.PENDING_REVIEW
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

  private async findArchitectOrFail(architectId: string) {
    const architect = await this.prisma.architect.findFirst({
      where: { id: architectId, deletedAt: null }
    });

    if (!architect) {
      throw new NotFoundException("Architect not found");
    }

    return architect;
  }
}
