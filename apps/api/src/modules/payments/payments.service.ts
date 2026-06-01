import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto, customerId: string) {
    if (!dto.terrainId && !dto.projectId && !dto.simulationId) {
      throw new BadRequestException("Order requires terrain, project or simulation");
    }

    const [terrain, project, simulation] = await Promise.all([
      dto.terrainId ? this.prisma.terrain.findFirst({ where: { id: dto.terrainId, deletedAt: null } }) : null,
      dto.projectId ? this.prisma.project.findFirst({ where: { id: dto.projectId, deletedAt: null } }) : null,
      dto.simulationId
        ? this.prisma.simulation.findFirst({ where: { id: dto.simulationId, deletedAt: null } })
        : null
    ]);

    const subtotal =
      Number(terrain?.price ?? 0) +
      Number(project?.price ?? 0) +
      (simulation ? Number(simulation.estimatedBuildCost) : 0);
    const fees = Number((subtotal * 0.035).toFixed(2));
    const total = Number((subtotal + fees).toFixed(2));

    return this.prisma.order.create({
      data: {
        customerId,
        terrainId: dto.terrainId,
        projectId: dto.projectId,
        simulationId: dto.simulationId,
        subtotal,
        fees,
        total,
        status: OrderStatus.PENDING_PAYMENT
      }
    });
  }

  async createCheckout(dto: CreateCheckoutDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, deletedAt: null }
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: dto.provider,
        status: PaymentStatus.PENDING,
        amount: order.total,
        splitPayload: {
          platform: 0.12,
          architect: order.projectId ? 0.7 : 0,
          terrainOwner: order.terrainId ? 0.88 : 0
        }
      }
    });

    return {
      payment,
      checkoutUrl: `https://payments.example.test/${dto.provider.toLowerCase()}/${payment.id}`
    };
  }

  async handleWebhook(provider: string, payload: Record<string, unknown>) {
    return {
      received: true,
      provider,
      payload,
      processedAt: new Date().toISOString()
    };
  }
}
