import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';

type MockRepository = Partial<Record<keyof Repository<Category>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findAndCount: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  softRemove: jest.fn(),
});

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: MockRepository;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated categories', async () => {
      const categories = [{ id: 1, name: 'Tech' }];
      repository.findAndCount!.mockResolvedValue([categories, 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(categories);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: { name: 'ASC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findById', () => {
    it('should return a category by id', async () => {
      const category = { id: 1, name: 'Tech' };
      repository.findOneBy!.mockResolvedValue(category);

      const result = await service.findById(1);

      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const dto = { name: 'Tech', description: 'Technology posts' };
      repository.findOneBy!.mockResolvedValue(null);
      repository.create!.mockReturnValue({ id: 1, ...dto });
      repository.save!.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);

      expect(result).toEqual({ id: 1, ...dto });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate name', async () => {
      repository.findOneBy!.mockResolvedValue({ id: 1, name: 'Tech' });

      await expect(
        service.create({ name: 'Tech', description: 'Duplicate' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft-remove a category', async () => {
      const category = { id: 1, name: 'Tech' };
      repository.findOneBy!.mockResolvedValue(category);
      repository.softRemove!.mockResolvedValue(category);

      await service.remove(1);

      expect(repository.softRemove).toHaveBeenCalledWith(category);
    });

    it('should throw NotFoundException when removing non-existent category', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
