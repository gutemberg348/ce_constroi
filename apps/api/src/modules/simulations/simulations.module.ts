import { Module } from "@nestjs/common";
import { CaixaFinancingService } from "./caixa-financing.service";
import { SimulationsController } from "./simulations.controller";
import { SimulationsService } from "./simulations.service";

@Module({
  controllers: [SimulationsController],
  providers: [CaixaFinancingService, SimulationsService]
})
export class SimulationsModule {}
