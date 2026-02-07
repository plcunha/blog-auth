import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva', description: 'Full name' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'joao@email.com', description: 'Unique email' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @MaxLength(150)
  email: string;

  @ApiProperty({
    example: 'joaosilva',
    description: 'Unique username (min 3 chars)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username é obrigatório' })
  @MinLength(3, { message: 'Username deve ter no mínimo 3 caracteres' })
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'secret123', description: 'Password (min 6 chars)' })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiPropertyOptional({ example: 'user', description: 'Role (default: user)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  role?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Active status (default: true)',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
