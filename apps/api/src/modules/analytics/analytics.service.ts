import { Injectable } from "@nestjs/common";
import { Prisma } from "@/generated/prisma/client";
import { PrismaService } from "@/database/prisma/prisma.service";
import { CreateSiteEventDto } from "./dto/create-site-event.dto";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSiteEventDto, context: { userId?: string; ip?: string; userAgent?: string }) {
    return this.prisma.siteEvent.create({
      data: {
        userId: context.userId,
        type: dto.type,
        path: dto.path,
        ip: context.ip,
        userAgent: context.userAgent,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined
      }
    });
  }
}
