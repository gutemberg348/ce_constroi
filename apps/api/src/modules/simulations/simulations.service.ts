import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma/prisma.service";
import { CaixaFinancingService } from "./caixa-financing.service";
import { CreateSimulationDto } from "./dto/create-simulation.dto";

@Injectable()
export class SimulationsService {
  constructor(
    private readonly caixaFinancingService: CaixaFinancingService,
    private readonly prisma: PrismaService
  ) {}

  async preview(dto: CreateSimulationDto) {
    const [terrain, project] = await this.loadCatalogReferences(dto);

    return this.caixaFinancingService.simulate(dto, {
      terrainPrice: terrain ? Number(terrain.price) : undefined,
      projectPrice: project ? Number(project.price) : undefined,
      estimatedBuildCost: project ? Number(project.estimatedBuildCost) : undefined
    });
  }

  async create(dto: CreateSimulationDto, userId?: string) {
    const [terrain, project] = await this.loadCatalogReferences(dto);
    const simulation = this.caixaFinancingService.simulate(dto, {
      terrainPrice: terrain ? Number(terrain.price) : undefined,
      projectPrice: project ? Number(project.price) : undefined,
      estimatedBuildCost: project ? Number(project.estimatedBuildCost) : undefined
    });
    const { input, result, rules } = simulation;

    return this.prisma.simulation.create({
      data: {
        customerId: userId,
        terrainId: dto.terrainId,
        projectId: dto.projectId,
        terrainPrice: input.terrainPrice,
        projectPrice: input.projectPrice,
        estimatedBuildCost: input.buildCost,
        downPayment: result.cashAtStart,
        installmentCount: result.termMonths,
        monthlyPayment: result.firstPayment,
        interestRate: result.monthlyRate,
        totalAmount: result.totalWithInitial,
        metadata: {
          source: "caixa-parameter-table",
          rulesVersion: rules.version,
          catalogSource: terrain || project ? "catalog" : "manual",
          input,
          result,
          rules
        }
      }
    });
  }

  private loadCatalogReferences(dto: CreateSimulationDto) {
    return Promise.all([
      dto.terrainId ? this.prisma.terrain.findFirst({ where: { id: dto.terrainId, deletedAt: null } }) : null,
      dto.projectId ? this.prisma.project.findFirst({ where: { id: dto.projectId, deletedAt: null } }) : null
    ]);
  }
}
