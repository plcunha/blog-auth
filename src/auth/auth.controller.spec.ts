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
    };

    usersService = {
      create: jest.fn(),
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
    it('should return access_token from authService', async () => {
      const token = { access_token: 'jwt-token' };
      authService.signIn!.mockResolvedValue(token);

      const result = await controller.signIn({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toEqual(token);
      expect(authService.signIn).toHaveBeenCalledWith(
        'testuser',
        'password123',
      );
    });
  });

  describe('getProfile', () => {
    it('should return the current user from JWT payload', () => {
      const user = { sub: 1, username: 'testuser' };

      const result = controller.getProfile(user);

      expect(result).toEqual(user);
    });
  });
});
