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
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  @MaxLength(150)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Username é obrigatório' })
  @MinLength(3, { message: 'Username deve ter no mínimo 3 caracteres' })
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  role?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
