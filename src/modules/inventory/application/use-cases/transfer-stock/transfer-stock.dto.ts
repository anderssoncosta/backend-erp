import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @ApiProperty() @IsUUID() materialId: string;
  @ApiProperty() @IsNumber() @IsPositive() quantity: number;
}

export class TransferStockDto {
  @ApiProperty() @IsUUID() fromBranchId: string;
  @ApiProperty() @IsUUID() toBranchId: string;

  @ApiProperty({ type: [TransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
