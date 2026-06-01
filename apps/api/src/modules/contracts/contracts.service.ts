import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma/prisma.service";
import { CreateContractDto } from "./dto/create-contract.dto";

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContractDto) {
    return this.prisma.contract.upsert({
      where: { orderId: dto.orderId },
      create: {
        orderId: dto.orderId,
        status: "PENDING_SIGNATURE"
      },
      update: {
        status: "PENDING_SIGNATURE"
      }
    });
  }

  findByOrder(orderId: string) {
    return this.prisma.contract.findUnique({
      where: { orderId }
    });
  }
}
