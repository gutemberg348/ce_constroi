import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateSiteEventDto {
  @ApiProperty({ example: "page_view" })
  @IsString()
  @MaxLength(80)
  type!: string;

  @ApiProperty({ example: "/terrenos" })
  @IsString()
  @MaxLength(500)
  path!: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
