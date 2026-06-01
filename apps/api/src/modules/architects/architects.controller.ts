import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { ArchitectsService } from "./architects.service";
import { UpdateArchitectProfileDto } from "./dto/update-architect-profile.dto";

@ApiTags("architects")
@ApiBearerAuth()
@Controller("architects")
@Roles(UserRole.ARCHITECT, UserRole.ADMIN)
export class ArchitectsController {
  constructor(private readonly architectsService: ArchitectsService) {}

  @Get("me")
  me(@CurrentUser() user: { sub: string }) {
    return this.architectsService.me(user.sub);
  }

  @Patch("me")
  updateMe(@CurrentUser() user: { sub: string }, @Body() dto: UpdateArchitectProfileDto) {
    return this.architectsService.updateMe(user.sub, dto);
  }

  @Get("me/stats")
  stats(@CurrentUser() user: { sub: string }) {
    return this.architectsService.stats(user.sub);
  }
}
