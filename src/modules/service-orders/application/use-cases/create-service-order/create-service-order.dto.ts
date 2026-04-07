import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PriorityLevel } from '../../../domain/value-objects/priority-level.vo';

export class CreateServiceOrderDto {
  @ApiProperty({ example: 'branch-uuid' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ example: 'client-uuid' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ example: 'contract-uuid' })
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @ApiProperty({ example: 'Manutenção corretiva no poste 123' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Detalhe da ocorrência...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'CORRECTIVE' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiPropertyOptional({ enum: PriorityLevel, default: PriorityLevel.MEDIUM })
  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: '2024-01-15T18:00:00Z' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  address?: Record<string, unknown>;
}
