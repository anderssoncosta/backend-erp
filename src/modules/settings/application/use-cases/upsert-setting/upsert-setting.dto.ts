import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertSettingDto {
  @ApiProperty() @IsString() @IsNotEmpty() module: string;
  @ApiProperty() @IsString() @IsNotEmpty() key: string;
  @ApiProperty() value: unknown;
  @ApiPropertyOptional() @IsOptional() @IsString() label?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
