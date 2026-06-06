import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";
import { CreateTerrainImageDto } from "./dto/create-terrain-image.dto";

@Injectable()
export class TerrainImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTerrainImageDto, user: { sub: string; role: string }) {
    if (!dto.terrainId) {
      throw new BadRequestException("terrainId is required");
    }

    const terrain = await this.prisma.terrain.findFirst({
      where: { id: dto.terrainId, deletedAt: null },
      select: { id: true, ownerId: true }
    });

    if (!terrain) {
      throw new NotFoundException("Terrain not found");
    }

    if (user.role !== UserRole.ADMIN && terrain.ownerId !== user.sub) {
      throw new ForbiddenException("You can only add images to your own terrain");
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCover) {
        await tx.terrainImage.updateMany({
          where: { terrainId: terrain.id, deletedAt: null },
          data: { isCover: false }
        });
      }

      return tx.terrainImage.create({
        data: {
          terrainId: terrain.id,
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
    const image = await this.prisma.terrainImage.findFirst({
      where: { id, deletedAt: null },
      include: { terrain: { select: { ownerId: true } } }
    });

    if (!image) {
      throw new NotFoundException("Terrain image not found");
    }

    if (user.role !== UserRole.ADMIN && image.terrain.ownerId !== user.sub) {
      throw new ForbiddenException("You can only remove images from your own terrain");
    }

    return this.prisma.terrainImage.update({
      where: { id: image.id },
      data: { deletedAt: new Date() }
    });
  }
}
