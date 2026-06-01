import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Post("orders")
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: { sub: string }) {
    return this.paymentsService.createOrder(dto, user.sub);
  }

  @ApiBearerAuth()
  @Post("checkout")
  createCheckout(@Body() dto: CreateCheckoutDto) {
    return this.paymentsService.createCheckout(dto);
  }

  @Public()
  @Post("webhooks/:provider")
  webhook(@Param("provider") provider: string, @Body() payload: Record<string, unknown>) {
    return this.paymentsService.handleWebhook(provider, payload);
  }
}
