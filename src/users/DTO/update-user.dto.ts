import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'João Atualizado' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'novo@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({
    example: 'newsecret123',
    description: 'New password (min 6 chars)',
  })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password?: string;

  @ApiPropertyOptional({ example: 'admin', enum: ['user', 'admin'] })
  @IsIn(['user', 'admin'], { message: 'Role deve ser "user" ou "admin"' })
  @IsOptional()
  role?: 'user' | 'admin';

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
