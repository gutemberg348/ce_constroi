import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ default: 12, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 12;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}

export type PaginatedResult<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const getPagination = (query: PaginationQueryDto) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit
  };
};
