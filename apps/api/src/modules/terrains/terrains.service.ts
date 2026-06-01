import { Injectable, NotFoundException } from "@nestjs/common";
import { UserRole } from "@/generated/prisma/enums";
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
      city: dto.city,
      state: dto.state,
      zipCode: dto.zipCode,
      areaM2: dto.areaM2,
      price: dto.price,
      frontageM: dto.frontageM,
      depthM: dto.depthM,
      zoning: dto.zoning,
      owner: user.role === UserRole.ADMIN ? undefined : { connect: { id: user.sub } }
    });
  }

  async update(id: string, dto: UpdateTerrainDto) {
    await this.findOne(id);
    return this.terrainsRepository.update(id, dto);
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
