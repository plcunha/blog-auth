import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
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
    it('should return an access token when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      (usersService.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
      });

      const result = await authService.signIn('testuser', 'correct-password');

      expect(result).toEqual({ access_token: 'signed-token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        username: 'testuser',
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.signIn('unknown', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      (usersService.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
      });

      await expect(
        authService.signIn('testuser', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
