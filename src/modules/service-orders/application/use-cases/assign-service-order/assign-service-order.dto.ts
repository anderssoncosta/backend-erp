import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignServiceOrderDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId: string;
}
