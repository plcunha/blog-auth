import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Meu Primeiro Post' })
  title: string;

  @ApiProperty({ example: 'Conteúdo completo do post...' })
  content: string;

  @ApiProperty({ example: 'meu-primeiro-post' })
  slug: string;

  @ApiProperty({ example: false })
  isPublished: boolean;

  @ApiProperty({ example: 1 })
  authorId: number;

  @ApiPropertyOptional({ example: 1 })
  categoryId: number;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
