import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateTerrainFeaturedDto {
  @ApiProperty()
  @IsBoolean()
  isFeaturedOnHome!: boolean;
}
