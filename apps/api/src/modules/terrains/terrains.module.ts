import { Module } from "@nestjs/common";
import { TerrainsController } from "./terrains.controller";
import { TerrainsRepository } from "./repositories/terrains.repository";
import { TerrainsService } from "./terrains.service";

@Module({
  controllers: [TerrainsController],
  providers: [TerrainsRepository, TerrainsService],
  exports: [TerrainsRepository, TerrainsService]
})
export class TerrainsModule {}
