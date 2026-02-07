import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    authService = {
      signIn: jest.fn(),
      refreshTokens: jest.fn(),
    };

    usersService = {
      create: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should create and return a new user', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@test.com',
        username: 'johndoe',
        password: 'secret123',
      };
      const created = {
        id: 1,
        name: 'John Doe',
        email: 'john@test.com',
        username: 'johndoe',
        role: 'user',
        isActive: true,
      };
      usersService.create!.mockResolvedValue(created);

      const result = await controller.register(dto);

      expect(result).toEqual(created);
      expect(usersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('signIn', () => {
    it('should return access_token and refresh_token from authService', async () => {
      const tokens = {
        access_token: 'jwt-token',
        refresh_token: 'refresh-token',
      };
      authService.signIn!.mockResolvedValue(tokens);

      const result = await controller.signIn({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toEqual(tokens);
      expect(authService.signIn).toHaveBeenCalledWith(
        'testuser',
        'password123',
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens from authService', async () => {
      const tokens = {
        access_token: 'new-jwt-token',
        refresh_token: 'new-refresh-token',
      };
      authService.refreshTokens!.mockResolvedValue(tokens);

      const result = await controller.refresh({
        refresh_token: 'old-refresh-token',
      });

      expect(result).toEqual(tokens);
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'old-refresh-token',
      );
    });
  });

  describe('getProfile', () => {
    it('should return the full user from the database', async () => {
      const fullUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        username: 'testuser',
        role: 'user',
        isActive: true,
      };
      usersService.findById!.mockResolvedValue(fullUser);

      const result = await controller.getProfile(1);

      expect(result).toEqual(fullUser);
      expect(usersService.findById).toHaveBeenCalledWith(1);
    });
  });
});
