import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma/prisma.service";
import { CreateFavoriteDto } from "./dto/create-favorite.dto";

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        terrain: {
          include: {
            images: {
              where: { deletedAt: null },
              orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
              take: 1
            }
          }
        },
        project: {
          include: {
            architect: { include: { user: { select: { id: true, name: true } } } },
            images: {
              where: { deletedAt: null },
              orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async add(userId: string, dto: CreateFavoriteDto) {
    if ((dto.terrainId && dto.projectId) || (!dto.terrainId && !dto.projectId)) {
      throw new BadRequestException("Favorite requires exactly one target");
    }

    const existing = await this.prisma.favorite.findFirst({
      where: {
        userId,
        terrainId: dto.terrainId ?? null,
        projectId: dto.projectId ?? null
      }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.favorite.create({
      data: {
        userId,
        terrainId: dto.terrainId,
        projectId: dto.projectId
      }
    });
  }

  async remove(id: string, userId: string) {
    const favorite = await this.prisma.favorite.findFirst({
      where: { id, userId }
    });

    if (!favorite) {
      throw new NotFoundException("Favorite not found");
    }

    return this.prisma.favorite.delete({
      where: { id: favorite.id }
    });
  }
}
