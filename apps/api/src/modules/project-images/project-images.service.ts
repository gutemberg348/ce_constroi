import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ArchitectStatus, UserRole } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";
import { CreateProjectImageDto } from "./dto/create-project-image.dto";

@Injectable()
export class ProjectImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectImageDto, user: { sub: string; role: string }) {
    if (!dto.projectId) {
      throw new BadRequestException("projectId is required");
    }

    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, deletedAt: null },
      select: {
        id: true,
        architect: { select: { userId: true, status: true } }
      }
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (user.role !== UserRole.ADMIN && project.architect.userId !== user.sub) {
      throw new ForbiddenException("You can only add images to your own project");
    }

    if (user.role !== UserRole.ADMIN && project.architect.status !== ArchitectStatus.APPROVED) {
      throw new ForbiddenException("Architect profile must be approved before changing project images");
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCover) {
        await tx.projectImage.updateMany({
          where: { projectId: project.id, deletedAt: null },
          data: { isCover: false }
        });
      }

      return tx.projectImage.create({
        data: {
          projectId: project.id,
          url: dto.url,
          storageKey: dto.storageKey ?? dto.url,
          altText: dto.altText,
          sortOrder: dto.sortOrder ?? 0,
          isCover: dto.isCover ?? false
        }
      });
    });
  }

  async remove(id: string, user: { sub: string; role: string }) {
    const image = await this.prisma.projectImage.findFirst({
      where: { id, deletedAt: null },
      include: { project: { include: { architect: { select: { userId: true, status: true } } } } }
    });

    if (!image) {
      throw new NotFoundException("Project image not found");
    }

    if (user.role !== UserRole.ADMIN && image.project.architect.userId !== user.sub) {
      throw new ForbiddenException("You can only remove images from your own project");
    }

    if (user.role !== UserRole.ADMIN && image.project.architect.status !== ArchitectStatus.APPROVED) {
      throw new ForbiddenException("Architect profile must be approved before changing project images");
    }

    return this.prisma.projectImage.update({
      where: { id: image.id },
      data: { deletedAt: new Date() }
    });
  }
}
