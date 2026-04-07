import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectExpenseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
