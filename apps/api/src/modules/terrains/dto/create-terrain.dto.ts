import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateTerrainDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  state!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  condominiumId?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  areaM2!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  price!: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  frontageM?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  depthM?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zoning?: string;

  @ApiPropertyOptional({ type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
