import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma/prisma.service";
import { CreateProjectImageDto } from "./dto/create-project-image.dto";

@Injectable()
export class ProjectImagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProjectImageDto) {
    return this.prisma.projectImage.create({
      data: {
        projectId: dto.projectId,
        url: dto.url,
        storageKey: dto.storageKey,
        altText: dto.altText,
        sortOrder: dto.sortOrder ?? 0,
        isCover: dto.isCover ?? false
      }
    });
  }

  remove(id: string) {
    return this.prisma.projectImage.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
