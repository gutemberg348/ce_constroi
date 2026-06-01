import { Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.list(user.sub);
  }

  @Patch(":id/read")
  markAsRead(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.notificationsService.markAsRead(id, user.sub);
  }
}
