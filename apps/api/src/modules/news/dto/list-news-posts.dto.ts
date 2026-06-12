import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { NewsStatus } from "@/generated/prisma/enums";
import { PaginationQueryDto } from "@/common/pagination/pagination.dto";

export class ListNewsPostsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: NewsStatus })
  @IsEnum(NewsStatus)
  @IsOptional()
  status?: NewsStatus;
}
