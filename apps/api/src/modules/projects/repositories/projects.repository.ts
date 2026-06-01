import { Injectable } from "@nestjs/common";
import { Prisma } from "@/generated/prisma/client";
import { ProjectStatus } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";
import { ListProjectsDto } from "../dto/list-projects.dto";

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: ListProjectsDto, skip: number, take: number) {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      status: query.status ?? ProjectStatus.PUBLISHED,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
              { style: { contains: query.search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(query.style ? { style: { equals: query.style, mode: "insensitive" } } : {}),
      ...(query.bedrooms ? { bedrooms: { gte: query.bedrooms } } : {}),
      ...(query.minAreaM2 ? { areaM2: { gte: query.minAreaM2 } } : {}),
      ...(query.maxPrice ? { price: { lte: query.maxPrice } } : {})
    };

    return this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          architect: { include: { user: { select: { id: true, name: true } } } },
          images: {
            where: { deletedAt: null },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
            take: 6
          }
        }
      }),
      this.prisma.project.count({ where })
    ]);
  }

  findById(id: string) {
    return this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        architect: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }]
        },
        compatibilities: {
          where: { deletedAt: null },
          include: {
            terrain: {
              include: {
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

  create(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({ data });
  }

  update(id: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project.update({ where: { id }, data });
  }
}
