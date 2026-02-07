import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './users.entity';

type MockRepository = Partial<Record<keyof Repository<User>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: 1, name: 'Test User' }];
      repository.find!.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, name: 'Test User' };
      repository.findOneBy!.mockResolvedValue(user);

      const result = await service.findById(1);

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const dto = {
        name: 'John',
        email: 'john@test.com',
        username: 'john',
        password: 'secret123',
      };

      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockImplementation(
        (data: Record<string, unknown>) => ({ id: 1, ...data }),
      );
      repository.save!.mockImplementation((user: Record<string, unknown>) =>
        Promise.resolve({ ...user }),
      );

      const result = await service.create(dto);

      expect(result.password).not.toBe('secret123');
      expect(repository.save).toHaveBeenCalled();

      // Verify the password was actually hashed with bcrypt
      const savedArg = repository.create!.mock.calls[0][0];
      const isHashed = await bcrypt.compare('secret123', savedArg.password);
      expect(isHashed).toBe(true);
    });

    it('should throw ConflictException for duplicate username/email', async () => {
      repository.findOne!.mockResolvedValue({ id: 1, username: 'existing' });

      await expect(
        service.create({
          name: 'John',
          email: 'john@test.com',
          username: 'existing',
          password: 'secret123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove an existing user', async () => {
      const user = { id: 1, name: 'Test' };
      repository.findOneBy!.mockResolvedValue(user);
      repository.remove!.mockResolvedValue(user);

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException when removing non-existent user', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
