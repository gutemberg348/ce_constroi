import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { CompatibilityStatus } from "@/generated/prisma/enums";

export class CreateCompatibilityDto {
  @ApiProperty()
  @IsString()
  terrainId!: string;

  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiPropertyOptional({ enum: CompatibilityStatus })
  @IsEnum(CompatibilityStatus)
  @IsOptional()
  status?: CompatibilityStatus;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
