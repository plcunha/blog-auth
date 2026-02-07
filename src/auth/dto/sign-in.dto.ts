import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsString()
  @IsNotEmpty({ message: 'Username é obrigatório' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password é obrigatório' })
  @MinLength(4, { message: 'Password deve ter no mínimo 4 caracteres' })
  password: string;
}
