import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { Public } from "@/common/decorators/public.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { CompatibilityService } from "./compatibility.service";
import { CreateCompatibilityDto } from "./dto/create-compatibility.dto";

@ApiTags("compatibility")
@Controller("compatibility")
export class CompatibilityController {
  constructor(private readonly compatibilityService: CompatibilityService) {}

  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.ADMIN, UserRole.ARCHITECT)
  upsert(@Body() dto: CreateCompatibilityDto) {
    return this.compatibilityService.upsert(dto);
  }

  @Public()
  @Get("terrains/:terrainId")
  byTerrain(@Param("terrainId") terrainId: string) {
    return this.compatibilityService.findByTerrain(terrainId);
  }

  @Public()
  @Get("projects/:projectId")
  byProject(@Param("projectId") projectId: string) {
    return this.compatibilityService.findByProject(projectId);
  }
}
