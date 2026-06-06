import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { AnalyticsService } from "./analytics.service";
import { CreateSiteEventDto } from "./dto/create-site-event.dto";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post("events")
  create(
    @Body() dto: CreateSiteEventDto,
    @CurrentUser() user: { sub: string } | undefined,
    @Req() request: Request
  ) {
    const forwardedFor = request.headers["x-forwarded-for"];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]?.trim() || request.ip;

    return this.analyticsService.create(dto, {
      userId: user?.sub,
      ip,
      userAgent: request.headers["user-agent"]
    });
  }
}
