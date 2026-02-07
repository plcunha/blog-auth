import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const users = [{ id: 1, name: 'John' }];
      usersService.findAll!.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single user by id', async () => {
      const user = { id: 1, name: 'John' };
      usersService.findById!.mockResolvedValue(user);

      const result = await controller.findOne(1);

      expect(result).toEqual(user);
      expect(usersService.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const dto = {
        name: 'John',
        email: 'john@test.com',
        username: 'john',
        password: 'secret123',
      };
      const created = { id: 1, ...dto, password: 'hashed' };
      usersService.create!.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(usersService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const dto = { name: 'Updated Name' };
      const updated = { id: 1, name: 'Updated Name' };
      usersService.update!.mockResolvedValue(updated);

      const result = await controller.update(1, dto);

      expect(result).toEqual(updated);
      expect(usersService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should call remove on service', async () => {
      usersService.remove!.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(usersService.remove).toHaveBeenCalledWith(1);
    });
  });
});
