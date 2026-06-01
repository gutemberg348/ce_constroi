import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  architectId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  style?: string;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms!: number;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms!: number;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  suites?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  parkingSpaces?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  floors?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  areaM2!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  estimatedBuildCost!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  renderUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  floorPlanUrl?: string;
}
