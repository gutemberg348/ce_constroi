import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCondominiumDto {
  @ApiProperty()
  @IsString()
  name!: string;

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

  @ApiPropertyOptional({ description: "Incorporadora" })
  @IsString()
  @IsOptional()
  developer?: string;

  @ApiPropertyOptional({ description: "Construtora" })
  @IsString()
  @IsOptional()
  builder?: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  leisureInfrastructure?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  securityInfrastructure?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  servicesInfrastructure?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  condominiumValue?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  constructionRules?: string;

  @ApiPropertyOptional({ default: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
