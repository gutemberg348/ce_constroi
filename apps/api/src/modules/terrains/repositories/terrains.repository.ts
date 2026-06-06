import { Injectable } from "@nestjs/common";
import { Prisma } from "@/generated/prisma/client";
import { TerrainStatus } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";
import { ListTerrainsDto } from "../dto/list-terrains.dto";

@Injectable()
export class TerrainsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: ListTerrainsDto, skip: number, take: number) {
    const where: Prisma.TerrainWhereInput = {
      deletedAt: null,
      status: query.status ?? TerrainStatus.AVAILABLE,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
              { address: { contains: query.search, mode: "insensitive" } },
              { neighborhood: { contains: query.search, mode: "insensitive" } },
              { city: { contains: query.search, mode: "insensitive" } },
              { state: { contains: query.search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
      ...(query.neighborhood ? { neighborhood: { equals: query.neighborhood, mode: "insensitive" } } : {}),
      ...(query.state ? { state: { equals: query.state, mode: "insensitive" } } : {}),
      ...(query.minAreaM2 ? { areaM2: { gte: query.minAreaM2 } } : {}),
      ...(query.minPrice || query.maxPrice
        ? {
            price: {
              ...(query.minPrice ? { gte: query.minPrice } : {}),
              ...(query.maxPrice ? { lte: query.maxPrice } : {})
            }
          }
        : {})
    };

    return this.prisma.$transaction([
      this.prisma.terrain.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            where: { deletedAt: null },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
            take: 6
          },
          compatibilities: {
            where: { deletedAt: null },
            take: 4,
            include: {
              project: {
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
      }),
      this.prisma.terrain.count({ where })
    ]);
  }

  findById(id: string) {
    return this.prisma.terrain.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }]
        },
        compatibilities: {
          where: { deletedAt: null },
          include: {
            project: {
              include: {
                architect: { include: { user: { select: { id: true, name: true } } } },
                images: {
                  where: { deletedAt: null },
                  orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
                  take: 2
                }
              }
            }
          }
        }
      }
    });
  }

  create(data: Prisma.TerrainCreateInput) {
    return this.prisma.terrain.create({ data });
  }

  update(id: string, data: Prisma.TerrainUpdateInput) {
    return this.prisma.terrain.update({ where: { id }, data });
  }
}
