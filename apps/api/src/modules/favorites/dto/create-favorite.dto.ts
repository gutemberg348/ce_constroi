import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateFavoriteDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  terrainId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  projectId?: string;
}
