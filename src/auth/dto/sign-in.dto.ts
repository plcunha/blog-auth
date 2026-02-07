import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'johndoe', description: 'Username for login' })
  @IsString()
  @IsNotEmpty({ message: 'Username é obrigatório' })
  username: string;

  @ApiProperty({
    example: 'secret123',
    description: 'User password (min 4 chars)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password é obrigatório' })
  @MinLength(4, { message: 'Password deve ter no mínimo 4 caracteres' })
  password: string;
}
