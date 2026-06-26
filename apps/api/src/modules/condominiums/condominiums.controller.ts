import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { Public } from "@/common/decorators/public.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { CondominiumsService } from "./condominiums.service";
import { CreateCondominiumDto } from "./dto/create-condominium.dto";
import { CreateCondominiumImageDto } from "./dto/create-condominium-image.dto";
import { ListCondominiumsDto } from "./dto/list-condominiums.dto";
import { UpdateCondominiumDto } from "./dto/update-condominium.dto";

@ApiTags("condominiums")
@Controller("condominiums")
export class CondominiumsController {
  constructor(private readonly condominiumsService: CondominiumsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ListCondominiumsDto) {
    return this.condominiumsService.findAll(query);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.condominiumsService.findOne(id);
  }
}

@ApiTags("admin condominiums")
@ApiBearerAuth()
@Controller("admin/condominiums")
@Roles(UserRole.ADMIN)
export class AdminCondominiumsController {
  constructor(private readonly condominiumsService: CondominiumsService) {}

  @Get()
  findAll(@Query() query: ListCondominiumsDto) {
    return this.condominiumsService.findAll({ ...query, includeInactive: true }, true);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.condominiumsService.findOne(id, true);
  }

  @Post()
  create(@Body() dto: CreateCondominiumDto) {
    return this.condominiumsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCondominiumDto) {
    return this.condominiumsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.condominiumsService.remove(id);
  }

  @Post(":id/images")
  addImage(@Param("id") id: string, @Body() dto: CreateCondominiumImageDto) {
    return this.condominiumsService.addImage(id, dto);
  }

  @Delete("images/:id")
  removeImage(@Param("id") id: string) {
    return this.condominiumsService.removeImage(id);
  }
}
