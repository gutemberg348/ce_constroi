import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { CreateTerrainImageDto } from "./dto/create-terrain-image.dto";
import { TerrainImagesService } from "./terrain-images.service";

@ApiTags("terrain-images")
@ApiBearerAuth()
@Controller("terrain-images")
@Roles(UserRole.ADMIN, UserRole.TERRAIN_OWNER)
export class TerrainImagesController {
  constructor(private readonly terrainImagesService: TerrainImagesService) {}

  @Post()
  create(@Body() dto: CreateTerrainImageDto, @CurrentUser() user: { sub: string; role: string }) {
    return this.terrainImagesService.create(dto, user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: { sub: string; role: string }) {
    return this.terrainImagesService.remove(id, user);
  }
}
