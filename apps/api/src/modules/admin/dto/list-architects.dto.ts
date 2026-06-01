import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { ArchitectStatus } from "@/generated/prisma/enums";

export class ListArchitectsDto {
  @ApiPropertyOptional({ enum: ArchitectStatus, default: ArchitectStatus.PENDING_REVIEW })
  @IsEnum(ArchitectStatus)
  @IsOptional()
  status?: ArchitectStatus;
}
