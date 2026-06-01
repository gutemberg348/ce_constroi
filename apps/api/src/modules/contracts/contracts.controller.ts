import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@/generated/prisma/enums";
import { Roles } from "@/common/decorators/roles.decorator";
import { ContractsService } from "./contracts.service";
import { CreateContractDto } from "./dto/create-contract.dto";

@ApiTags("contracts")
@ApiBearerAuth()
@Controller("contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto);
  }

  @Get("orders/:orderId")
  findByOrder(@Param("orderId") orderId: string) {
    return this.contractsService.findByOrder(orderId);
  }
}
