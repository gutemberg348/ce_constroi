import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@/generated/prisma/client";
import { PrismaService } from "@/database/prisma/prisma.service";
import { getPagination } from "@/common/pagination/pagination.dto";
import { CreateCondominiumDto } from "./dto/create-condominium.dto";
import { CreateCondominiumImageDto } from "./dto/create-condominium-image.dto";
import { ListCondominiumsDto } from "./dto/list-condominiums.dto";
import { UpdateCondominiumDto } from "./dto/update-condominium.dto";

@Injectable()
export class CondominiumsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListCondominiumsDto, admin = false) {
    const pagination = getPagination(query);
    const where: Prisma.CondominiumWhereInput = {
      deletedAt: null,
      ...(admin && query.includeInactive ? {} : { isActive: true }),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { address: { contains: query.search, mode: "insensitive" } },
              { neighborhood: { contains: query.search, mode: "insensitive" } },
              { city: { contains: query.search, mode: "insensitive" } },
              { state: { contains: query.search, mode: "insensitive" } },
              { developer: { contains: query.search, mode: "insensitive" } },
              { builder: { contains: query.search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
      ...(query.neighborhood ? { neighborhood: { equals: query.neighborhood, mode: "insensitive" } } : {}),
      ...(query.state ? { state: { equals: query.state, mode: "insensitive" } } : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.condominium.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          images: {
            where: { deletedAt: null },
            orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
            take: 10
          },
          _count: { select: { terrains: true } }
        }
      }),
      this.prisma.condominium.count({ where })
    ]);

    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  }

  async findOne(id: string, admin = false) {
    const condominium = await this.prisma.condominium.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(admin ? {} : { isActive: true })
      },
      include: {
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 10
        },
        terrains: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          include: {
            images: {
              where: { deletedAt: null },
              orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
              take: 1
            }
          }
        },
        _count: { select: { terrains: true } }
      }
    });

    if (!condominium) {
      throw new NotFoundException("Condominium not found");
    }

    return condominium;
  }

  create(dto: CreateCondominiumDto) {
    return this.prisma.condominium.create({
      data: {
        ...this.toCreateData(dto),
        slug: this.slugify(dto.name)
      },
      include: {
        images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 10 },
        _count: { select: { terrains: true } }
      }
    });
  }

  async update(id: string, dto: UpdateCondominiumDto) {
    await this.findOne(id, true);

    return this.prisma.condominium.update({
      where: { id },
      data: this.toUpdateData(dto),
      include: {
        images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 10 },
        _count: { select: { terrains: true } }
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id, true);

    return this.prisma.$transaction(async (tx) => {
      await tx.terrain.updateMany({
        where: { condominiumId: id },
        data: { condominiumId: null }
      });

      return tx.condominium.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
        include: {
          images: { where: { deletedAt: null }, orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 10 },
          _count: { select: { terrains: true } }
        }
      });
    });
  }

  async addImage(condominiumId: string, dto: CreateCondominiumImageDto) {
    await this.findOne(condominiumId, true);

    const currentImages = await this.prisma.condominiumImage.count({
      where: { condominiumId, deletedAt: null }
    });

    if (currentImages >= 10) {
      throw new BadRequestException("O condominio pode ter no maximo 10 fotos.");
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCover) {
        await tx.condominiumImage.updateMany({
          where: { condominiumId, deletedAt: null },
          data: { isCover: false }
        });
      }

      return tx.condominiumImage.create({
        data: {
          condominiumId,
          url: dto.url,
          storageKey: dto.storageKey || dto.url,
          altText: dto.altText,
          sortOrder: dto.sortOrder ?? currentImages,
          isCover: dto.isCover ?? currentImages === 0
        }
      });
    });
  }

  async removeImage(imageId: string) {
    const image = await this.prisma.condominiumImage.findFirst({
      where: { id: imageId, deletedAt: null }
    });

    if (!image) {
      throw new NotFoundException("Condominium image not found");
    }

    return this.prisma.condominiumImage.update({
      where: { id: image.id },
      data: { deletedAt: new Date() }
    });
  }

  private toCreateData(dto: CreateCondominiumDto) {
    return {
      name: dto.name,
      address: dto.address,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
      zipCode: dto.zipCode,
      developer: dto.developer,
      builder: dto.builder,
      description: dto.description,
      leisureInfrastructure: dto.leisureInfrastructure,
      securityInfrastructure: dto.securityInfrastructure,
      servicesInfrastructure: dto.servicesInfrastructure,
      condominiumValue: dto.condominiumValue,
      constructionRules: dto.constructionRules,
      isActive: dto.isActive ?? true
    };
  }

  private toUpdateData(dto: UpdateCondominiumDto): Prisma.CondominiumUpdateInput {
    return {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.neighborhood !== undefined ? { neighborhood: dto.neighborhood } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.state !== undefined ? { state: dto.state } : {}),
      ...(dto.zipCode !== undefined ? { zipCode: dto.zipCode } : {}),
      ...(dto.developer !== undefined ? { developer: dto.developer } : {}),
      ...(dto.builder !== undefined ? { builder: dto.builder } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.leisureInfrastructure !== undefined ? { leisureInfrastructure: dto.leisureInfrastructure } : {}),
      ...(dto.securityInfrastructure !== undefined ? { securityInfrastructure: dto.securityInfrastructure } : {}),
      ...(dto.servicesInfrastructure !== undefined ? { servicesInfrastructure: dto.servicesInfrastructure } : {}),
      ...(dto.condominiumValue !== undefined ? { condominiumValue: dto.condominiumValue } : {}),
      ...(dto.constructionRules !== undefined ? { constructionRules: dto.constructionRules } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {})
    };
  }

  private slugify(value: string) {
    const slug = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    return `${slug}-${Date.now().toString(36)}`;
  }
}
