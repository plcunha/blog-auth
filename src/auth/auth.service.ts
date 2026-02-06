// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Método de login
  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    // Buscar o usuário no banco de dados
    const user = await this.usersService.findOne(username);

    // Verificar se o usuário foi encontrado e se a senha está correta
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Criar o payload com o ID e o username
    const payload = { sub: user.id, username: user.username };

    // Gerar o token JWT assinado
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
