import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { AdminService } from "./admin.service";
import { ListArchitectsDto } from "./dto/list-architects.dto";
import { RejectArchitectDto } from "./dto/reject-architect.dto";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("metrics")
  metrics() {
    return this.adminService.metrics();
  }

  @Get("architects")
  architects(@Query() query: ListArchitectsDto) {
    return this.adminService.listArchitects(query);
  }

  @Patch("architects/:id/approve")
  approveArchitect(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.approveArchitect(id, user.sub);
  }

  @Patch("architects/:id/reject")
  rejectArchitect(
    @Param("id") id: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: RejectArchitectDto
  ) {
    return this.adminService.rejectArchitect(id, user.sub, dto);
  }
}
