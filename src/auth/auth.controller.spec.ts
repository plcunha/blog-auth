import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    authService = {
      signIn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
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
