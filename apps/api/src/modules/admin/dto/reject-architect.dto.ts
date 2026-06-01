import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class RejectArchitectDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
