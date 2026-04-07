import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { MovementType } from '../../../domain/value-objects/movement-type.vo';

export class RegisterExitDto {
  @ApiProperty()
  @IsUUID()
  materialId: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ enum: [MovementType.EXIT, MovementType.CONSUMPTION, MovementType.LOSS] })
  @IsOptional()
  @IsEnum([MovementType.EXIT, MovementType.CONSUMPTION, MovementType.LOSS])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
