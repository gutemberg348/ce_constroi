import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma/prisma.service";
import { UserRole } from "@/generated/prisma/enums";
import { CreateCompatibilityDto } from "./dto/create-compatibility.dto";

@Injectable()
export class CompatibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: CreateCompatibilityDto, user: { sub: string; role: string }) {
    if (user.role !== UserRole.ADMIN) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, deletedAt: null },
        include: { architect: true }
      });

      if (!project) {
        throw new NotFoundException("Project not found");
      }

      if (project.architect.userId !== user.sub) {
        throw new ForbiddenException("You can only link your own projects to terrains");
      }
    }

    return this.prisma.projectCompatibility.upsert({
      where: {
        terrainId_projectId: {
          terrainId: dto.terrainId,
          projectId: dto.projectId
        }
      },
      create: {
        terrainId: dto.terrainId,
        projectId: dto.projectId,
        status: dto.status,
        score: dto.score ?? 0,
        notes: dto.notes
      },
      update: {
        status: dto.status,
        score: dto.score,
        notes: dto.notes
      }
    });
  }

  findByTerrain(terrainId: string) {
    return this.prisma.projectCompatibility.findMany({
      where: { terrainId, deletedAt: null },
      include: { project: { include: { images: { where: { deletedAt: null }, take: 1 } } } },
      orderBy: { score: "desc" }
    });
  }

  findByProject(projectId: string) {
    return this.prisma.projectCompatibility.findMany({
      where: { projectId, deletedAt: null },
      include: { terrain: { include: { images: { where: { deletedAt: null }, take: 1 } } } },
      orderBy: { score: "desc" }
    });
  }
}
