import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { NewsStatus } from "@/generated/prisma/enums";

export class CreateNewsPostDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(420)
  excerpt!: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  content!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(120)
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({ enum: NewsStatus })
  @IsEnum(NewsStatus)
  @IsOptional()
  status?: NewsStatus;
}
