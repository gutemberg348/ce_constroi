import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";

export enum UploadKind {
  TERRAIN_IMAGE = "TERRAIN_IMAGE",
  PROJECT_IMAGE = "PROJECT_IMAGE",
  RENDER_3D = "RENDER_3D",
  FLOOR_PLAN = "FLOOR_PLAN",
  CONTRACT_ATTACHMENT = "CONTRACT_ATTACHMENT"
}

export class PresignUploadDto {
  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty()
  @IsString()
  contentType!: string;

  @ApiProperty({ enum: UploadKind })
  @IsEnum(UploadKind)
  kind!: UploadKind;
}
