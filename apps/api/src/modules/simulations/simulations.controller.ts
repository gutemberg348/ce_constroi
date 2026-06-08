import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { CaixaFinancingService } from "./caixa-financing.service";
import { CreateSimulationDto } from "./dto/create-simulation.dto";
import { SimulationsService } from "./simulations.service";

@ApiTags("simulations")
@Controller("simulations")
export class SimulationsController {
  constructor(
    private readonly caixaFinancingService: CaixaFinancingService,
    private readonly simulationsService: SimulationsService
  ) {}

  @Public()
  @Get("caixa-rules")
  caixaRules() {
    return this.caixaFinancingService.getRules();
  }

  @ApiBearerAuth()
  @Post("caixa-preview")
  caixaPreview(@Body() dto: CreateSimulationDto) {
    return this.simulationsService.preview(dto);
  }

  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateSimulationDto, @CurrentUser() user: { sub: string }) {
    return this.simulationsService.create(dto, user.sub);
  }
}
