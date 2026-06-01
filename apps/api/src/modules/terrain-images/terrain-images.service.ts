import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma/prisma.service";
import { CreateTerrainImageDto } from "./dto/create-terrain-image.dto";

@Injectable()
export class TerrainImagesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTerrainImageDto) {
    return this.prisma.terrainImage.create({
      data: {
        terrainId: dto.terrainId,
        url: dto.url,
        storageKey: dto.storageKey,
        altText: dto.altText,
        sortOrder: dto.sortOrder ?? 0,
        isCover: dto.isCover ?? false
      }
    });
  }

  remove(id: string) {
    return this.prisma.terrainImage.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
