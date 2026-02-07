import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  role?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
