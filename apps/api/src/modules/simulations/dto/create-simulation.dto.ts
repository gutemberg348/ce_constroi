import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateSimulationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  terrainId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  terrainPrice?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  projectPrice?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  estimatedBuildCost?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  buildCost?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  downPayment?: number;

  @ApiPropertyOptional({ default: 240 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  @IsOptional()
  installmentCount?: number;

  @ApiPropertyOptional({ default: 0.011 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  monthlyInterestRate?: number;

  @ApiPropertyOptional({ default: 4.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  documentationRate?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  extraReserve?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  familyIncome?: number;

  @ApiPropertyOptional({ default: 1400 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyDebts?: number;

  @ApiPropertyOptional({ default: 36 })
  @Type(() => Number)
  @IsNumber()
  @Min(18)
  @Max(100)
  @IsOptional()
  buyerAge?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  dependents?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  ownCash?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  fgtsBalance?: number;

  @ApiPropertyOptional({ enum: ["yes", "no"], default: "yes" })
  @IsIn(["yes", "no"])
  @IsOptional()
  fgtsYears?: "yes" | "no";

  @ApiPropertyOptional({ enum: ["yes", "no"], default: "no" })
  @IsIn(["yes", "no"])
  @IsOptional()
  hasPropertySameCity?: "yes" | "no";

  @ApiPropertyOptional({ enum: ["yes", "no"], default: "no" })
  @IsIn(["yes", "no"])
  @IsOptional()
  activeSfh?: "yes" | "no";

  @ApiPropertyOptional({ enum: ["yes", "no"], default: "no" })
  @IsIn(["yes", "no"])
  @IsOptional()
  hasCreditRestriction?: "yes" | "no";

  @ApiPropertyOptional({ enum: ["N_NE", "OTHER"], default: "OTHER" })
  @IsIn(["N_NE", "OTHER"])
  @IsOptional()
  region?: "N_NE" | "OTHER";

  @ApiPropertyOptional({ enum: ["NEW", "USED", "CONSTRUCTION"], default: "CONSTRUCTION" })
  @IsIn(["NEW", "USED", "CONSTRUCTION"])
  @IsOptional()
  propertyType?: "NEW" | "USED" | "CONSTRUCTION";

  @ApiPropertyOptional({ enum: ["OWN_HOME", "INVESTMENT"], default: "OWN_HOME" })
  @IsIn(["OWN_HOME", "INVESTMENT"])
  @IsOptional()
  propertyUse?: "OWN_HOME" | "INVESTMENT";

  @ApiPropertyOptional({ enum: ["AUTO", "CAIXA_MCMV", "CAIXA_SBPE", "OTHER_BANK"], default: "AUTO" })
  @IsIn(["AUTO", "CAIXA_MCMV", "CAIXA_SBPE", "OTHER_BANK"])
  @IsOptional()
  program?: "AUTO" | "CAIXA_MCMV" | "CAIXA_SBPE" | "OTHER_BANK";

  @ApiPropertyOptional({ enum: ["SAC", "PRICE"], default: "SAC" })
  @IsIn(["SAC", "PRICE"])
  @IsOptional()
  system?: "SAC" | "PRICE";

  @ApiPropertyOptional({ default: 360 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  @IsOptional()
  months?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  annualInterestRate?: number;

  @ApiPropertyOptional({ default: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  insuranceRate?: number;
}
