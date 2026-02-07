import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: Partial<Record<keyof CategoriesService, jest.Mock>>;

  beforeEach(async () => {
    categoriesService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: categoriesService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated array of categories', async () => {
      const paginatedResult = {
        data: [{ id: 1, name: 'Tech' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      categoriesService.findAll!.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result).toEqual(paginatedResult);
      expect(categoriesService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single category by id', async () => {
      const category = { id: 1, name: 'Tech' };
      categoriesService.findById!.mockResolvedValue(category);

      const result = await controller.findOne(1);

      expect(result).toEqual(category);
      expect(categoriesService.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create and return a new category', async () => {
      const dto = { name: 'Tech', description: 'Tech posts' };
      const created = { id: 1, ...dto };
      categoriesService.create!.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toEqual(created);
      expect(categoriesService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update and return the category', async () => {
      const dto = { name: 'Updated Tech' };
      const updated = { id: 1, name: 'Updated Tech' };
      categoriesService.update!.mockResolvedValue(updated);

      const result = await controller.update(1, dto);

      expect(result).toEqual(updated);
      expect(categoriesService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should call remove on service', async () => {
      categoriesService.remove!.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(categoriesService.remove).toHaveBeenCalledWith(1);
    });
  });
});
