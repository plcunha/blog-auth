import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findByUsername: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access_token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      usersService.findByUsername!.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        role: 'user',
      });

      const result = await authService.signIn('testuser', 'correct-password');

      expect(result).toEqual({ access_token: 'signed-jwt-token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        username: 'testuser',
        role: 'user',
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findByUsername!.mockResolvedValue(null);

      await expect(
        authService.signIn('nonexistent', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      usersService.findByUsername!.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        role: 'user',
      });

      await expect(
        authService.signIn('testuser', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
