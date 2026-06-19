import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logoLightUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  logoDarkUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  defaultCreci?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  socialInstagramUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  socialFacebookUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  socialYoutubeUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  socialXUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  socialTiktokUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  socialLinkedinUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  socialWhatsappUrl?: string;
}
