import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'Refresh token received during login',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  refresh_token: string;
}
