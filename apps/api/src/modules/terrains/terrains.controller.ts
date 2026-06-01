import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { CreateTerrainDto } from "./dto/create-terrain.dto";
import { ListTerrainsDto } from "./dto/list-terrains.dto";
import { UpdateTerrainDto } from "./dto/update-terrain.dto";
import { TerrainsService } from "./terrains.service";

@ApiTags("terrains")
@Controller("terrains")
export class TerrainsController {
  constructor(private readonly terrainsService: TerrainsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ListTerrainsDto) {
    return this.terrainsService.findAll(query);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.terrainsService.findOne(id);
  }

  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.ADMIN, UserRole.TERRAIN_OWNER)
  create(@Body() dto: CreateTerrainDto, @CurrentUser() user: { sub: string; role: string }) {
    return this.terrainsService.create(dto, user);
  }

  @ApiBearerAuth()
  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.TERRAIN_OWNER)
  update(@Param("id") id: string, @Body() dto: UpdateTerrainDto) {
    return this.terrainsService.update(id, dto);
  }
}
