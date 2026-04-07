import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelServiceOrderDto {
  @ApiProperty({ example: 'Cliente solicitou cancelamento' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
