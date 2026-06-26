import { Module } from "@nestjs/common";
import { CondominiumsController, AdminCondominiumsController } from "./condominiums.controller";
import { CondominiumsService } from "./condominiums.service";

@Module({
  controllers: [CondominiumsController, AdminCondominiumsController],
  providers: [CondominiumsService],
  exports: [CondominiumsService]
})
export class CondominiumsModule {}
