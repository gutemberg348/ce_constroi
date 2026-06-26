import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: "cliente@exemplo.com" })
  @IsEmail()
  email!: string;
}
