import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Tecnologia', description: 'Category name (unique)' })
  @IsString()
  @IsNotEmpty({ message: 'Nome da categoria é obrigatório' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'Posts sobre tecnologia',
    description: 'Category description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Active status (default: true)',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
