import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateTerrainImageDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  terrainId?: string;

  @ApiProperty()
  @IsString()
  url!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storageKey?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  altText?: string;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isCover?: boolean;
}
