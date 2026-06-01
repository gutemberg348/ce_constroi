import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ArchitectStatus, UserRole } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";
import { getPagination } from "@/common/pagination/pagination.dto";
import { CreateProjectDto } from "./dto/create-project.dto";
import { ListProjectsDto } from "./dto/list-projects.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectsRepository } from "./repositories/projects.repository";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly prisma: PrismaService
  ) {}

  async findAll(query: ListProjectsDto) {
    const pagination = getPagination(query);
    const [items, total] = await this.projectsRepository.findMany(
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
    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async create(dto: CreateProjectDto, user: { sub: string; role: string }) {
    const architectId = await this.resolveArchitectId(dto.architectId, user);

    return this.projectsRepository.create({
      title: dto.title,
      slug: this.slugify(dto.title),
      description: dto.description,
      style: dto.style,
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      suites: dto.suites ?? 0,
      parkingSpaces: dto.parkingSpaces ?? 0,
      floors: dto.floors ?? 1,
      areaM2: dto.areaM2,
      estimatedBuildCost: dto.estimatedBuildCost,
      price: dto.price,
      renderUrl: dto.renderUrl,
      floorPlanUrl: dto.floorPlanUrl,
      architect: { connect: { id: architectId } }
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    return this.projectsRepository.update(id, dto);
  }

  private async resolveArchitectId(dtoArchitectId: string | undefined, user: { sub: string; role: string }) {
    if (user.role === UserRole.ADMIN && dtoArchitectId) {
      return dtoArchitectId;
    }

    const profile = await this.prisma.architect.findFirst({
      where: { userId: user.sub, deletedAt: null }
    });

    if (!profile) {
      throw new ForbiddenException("Architect profile required");
    }

    if (profile.status !== ArchitectStatus.APPROVED) {
      throw new ForbiddenException("Architect profile must be approved by admin before publishing projects");
    }

    return profile.id;
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
