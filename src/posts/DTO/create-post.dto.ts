import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'Meu Primeiro Post', description: 'Post title' })
  @IsString()
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Conteúdo completo do post aqui...',
    description: 'Post content (text)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Conteúdo é obrigatório' })
  content: string;

  @ApiPropertyOptional({
    example: 'meu-primeiro-post',
    description: 'URL slug (auto-generated from title if omitted)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Publish status (default: false)',
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Category ID' })
  @IsNumber({}, { message: 'categoryId deve ser um número' })
  @IsOptional()
  categoryId?: number;
}
