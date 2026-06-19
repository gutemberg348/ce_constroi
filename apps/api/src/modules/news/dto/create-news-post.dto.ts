import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { NewsStatus } from "@/generated/prisma/enums";

export class CreateNewsPostDto {
  @ApiProperty()
  @IsString()
  @MinLength(3, { message: "O titulo precisa ter pelo menos 3 caracteres." })
  @MaxLength(180, { message: "O titulo deve ter no maximo 180 caracteres." })
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3, { message: "O resumo precisa ter pelo menos 3 caracteres." })
  @MaxLength(420, { message: "O resumo deve ter no maximo 420 caracteres." })
  excerpt!: string;

  @ApiProperty()
  @IsString()
  @MinLength(20, { message: "O conteudo completo precisa ter pelo menos 20 caracteres." })
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
