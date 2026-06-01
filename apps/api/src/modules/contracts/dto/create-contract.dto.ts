import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateContractDto {
  @ApiProperty()
  @IsString()
  orderId!: string;
}
