import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";
import { PaymentProvider } from "@/generated/prisma/enums";

export class CreateCheckoutDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;
}
