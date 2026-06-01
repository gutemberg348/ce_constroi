import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { Roles } from "@/common/decorators/roles.decorator";
import { CreateProjectImageDto } from "./dto/create-project-image.dto";
import { ProjectImagesService } from "./project-images.service";

@ApiTags("project-images")
@ApiBearerAuth()
@Controller("project-images")
@Roles(UserRole.ADMIN, UserRole.ARCHITECT)
export class ProjectImagesController {
  constructor(private readonly projectImagesService: ProjectImagesService) {}

  @Post()
  create(@Body() dto: CreateProjectImageDto) {
    return this.projectImagesService.create(dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.projectImagesService.remove(id);
  }
}
