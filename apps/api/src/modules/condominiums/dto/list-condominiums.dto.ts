import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "@/common/pagination/pagination.dto";

export class ListCondominiumsDto extends PaginationQueryDto {
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
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}
