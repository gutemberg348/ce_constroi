import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { CreateProjectDto } from "./dto/create-project.dto";
import { ListProjectsDto } from "./dto/list-projects.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectsService } from "./projects.service";

@ApiTags("projects")
@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ListProjectsDto) {
    return this.projectsService.findAll(query);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.projectsService.findOne(id);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.ADMIN, UserRole.ARCHITECT)
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: { sub: string; role: string }) {
    return this.projectsService.create(dto, user);
  }

  @ApiBearerAuth()
  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.ARCHITECT)
  update(@Param("id") id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }
}
