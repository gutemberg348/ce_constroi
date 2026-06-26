import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { TerrainStatus } from "@/generated/prisma/enums";
import { PaginationQueryDto } from "@/common/pagination/pagination.dto";

function booleanQuery(value: unknown) {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return value;
}

export class ListTerrainsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TerrainStatus })
  @IsEnum(TerrainStatus)
  @IsOptional()
  status?: TerrainStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minAreaM2?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => booleanQuery(value))
  @IsBoolean()
  @IsOptional()
  featuredOnHome?: boolean;
}
