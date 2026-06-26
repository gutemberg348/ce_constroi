import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { envValidationSchema } from "./config/env.validation";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { PrismaModule } from "./database/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ArchitectsModule } from "./modules/architects/architects.module";
import { TerrainsModule } from "./modules/terrains/terrains.module";
import { TerrainImagesModule } from "./modules/terrain-images/terrain-images.module";
import { CondominiumsModule } from "./modules/condominiums/condominiums.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { ProjectImagesModule } from "./modules/project-images/project-images.module";
import { CompatibilityModule } from "./modules/compatibility/compatibility.module";
import { SimulationsModule } from "./modules/simulations/simulations.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AdminModule } from "./modules/admin/admin.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { NewsModule } from "./modules/news/news.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: envValidationSchema,
      envFilePath: [".env.local", "../../.env.local", ".env", "../../.env"]
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100
      }
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ArchitectsModule,
    TerrainsModule,
    TerrainImagesModule,
    CondominiumsModule,
    ProjectsModule,
    ProjectImagesModule,
    CompatibilityModule,
    SimulationsModule,
    PaymentsModule,
    ContractsModule,
    FavoritesModule,
    UploadsModule,
    NotificationsModule,
    SettingsModule,
    AnalyticsModule,
    DashboardModule,
    NewsModule,
    AdminModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
