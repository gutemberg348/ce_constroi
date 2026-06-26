import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@/generated/prisma/client";
import { TerrainStatus, UserRole } from "@/generated/prisma/enums";
import { getPagination } from "@/common/pagination/pagination.dto";
import { CreateTerrainDto } from "./dto/create-terrain.dto";
import { ListTerrainsDto } from "./dto/list-terrains.dto";
import { UpdateTerrainDto } from "./dto/update-terrain.dto";
import { TerrainsRepository } from "./repositories/terrains.repository";

@Injectable()
export class TerrainsService {
  constructor(private readonly terrainsRepository: TerrainsRepository) {}

  async findAll(query: ListTerrainsDto) {
    const pagination = getPagination(query);
    const [items, total] = await this.terrainsRepository.findMany(
      query,
      pagination.skip,
      pagination.take
    );

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

  async findOne(id: string) {
    const terrain = await this.terrainsRepository.findById(id);

    if (!terrain) {
      throw new NotFoundException("Terrain not found");
    }

    return terrain;
  }

  create(dto: CreateTerrainDto, user: { sub: string; role: string }) {
    return this.terrainsRepository.create({
      title: dto.title,
      slug: this.slugify(dto.title),
      description: dto.description,
      address: dto.address,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
      zipCode: dto.zipCode,
      areaM2: dto.areaM2,
      price: dto.price,
      frontageM: dto.frontageM,
      depthM: dto.depthM,
      zoning: dto.zoning,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      status: user.role === UserRole.ADMIN ? TerrainStatus.AVAILABLE : TerrainStatus.PENDING_REVIEW,
      owner: user.role === UserRole.ADMIN ? undefined : { connect: { id: user.sub } },
      condominium: dto.condominiumId ? { connect: { id: dto.condominiumId } } : undefined
    });
  }

  async update(id: string, dto: UpdateTerrainDto, user: { sub: string; role: string }) {
    const terrain = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && terrain.ownerId !== user.sub) {
      throw new ForbiddenException("You can only update your own terrain");
    }

    const { metadata, condominiumId, ...data } = dto;

    return this.terrainsRepository.update(id, {
      ...data,
      ...(condominiumId !== undefined
        ? { condominium: condominiumId ? { connect: { id: condominiumId } } : { disconnect: true } }
        : {}),
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      ...(user.role === UserRole.ADMIN ? {} : { status: TerrainStatus.PENDING_REVIEW })
    });
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
