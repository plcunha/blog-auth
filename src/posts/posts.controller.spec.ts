import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { AuthGuard } from '../auth/auth.guard';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: Partial<Record<keyof PostsService, jest.Mock>>;

  const ownerUser = { sub: 5, role: 'user' };
  const adminUser = { sub: 99, role: 'admin' };
  const otherUser = { sub: 10, role: 'user' };

  beforeEach(async () => {
    postsService = {
      findAll: jest.fn(),
      findPublished: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: postsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findPublished', () => {
    it('should return paginated published posts', async () => {
      const paginatedResult = {
        data: [{ id: 1, title: 'Published', isPublished: true }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      postsService.findPublished!.mockResolvedValue(paginatedResult);

      const result = await controller.findPublished({ page: 1, limit: 20 });

      expect(result).toEqual(paginatedResult);
      expect(postsService.findPublished).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated posts including drafts', async () => {
      const paginatedResult = {
        data: [
          { id: 1, title: 'Published', isPublished: true },
          { id: 2, title: 'Draft', isPublished: false },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      postsService.findAll!.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result).toEqual(paginatedResult);
      expect(postsService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  describe('findOne', () => {
    it('should return a single post by id', async () => {
      const post = { id: 1, title: 'Test Post' };
      postsService.findById!.mockResolvedValue(post);

      const result = await controller.findOne(1);

      expect(result).toEqual(post);
      expect(postsService.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('findBySlug', () => {
    it('should return a post by slug', async () => {
      const post = { id: 1, title: 'Test Post', slug: 'test-post' };
      postsService.findBySlug!.mockResolvedValue(post);

      const result = await controller.findBySlug('test-post');

      expect(result).toEqual(post);
      expect(postsService.findBySlug).toHaveBeenCalledWith('test-post');
    });
  });

  describe('create', () => {
    it('should create a post with the author from JWT', async () => {
      const dto = { title: 'New Post', content: 'Content here' };
      const created = { id: 1, ...dto, slug: 'new-post', authorId: 5 };
      postsService.create!.mockResolvedValue(created);

      const result = await controller.create(dto, 5);

      expect(result).toEqual(created);
      expect(postsService.create).toHaveBeenCalledWith(dto, 5);
    });
  });

  describe('update', () => {
    it('should allow owner to update their own post', async () => {
      const post = { id: 1, title: 'My Post', authorId: 5 };
      postsService.findById!.mockResolvedValue(post);
      const dto = { title: 'Updated Title' };
      const updated = { id: 1, title: 'Updated Title' };
      postsService.update!.mockResolvedValue(updated);

      const result = await controller.update(1, dto, ownerUser);

      expect(result).toEqual(updated);
      expect(postsService.update).toHaveBeenCalledWith(1, dto);
    });

    it('should allow admin to update any post', async () => {
      const dto = { title: 'Admin Updated' };
      const updated = { id: 1, title: 'Admin Updated' };
      postsService.update!.mockResolvedValue(updated);

      const result = await controller.update(1, dto, adminUser);

      expect(result).toEqual(updated);
      // Admin should NOT call findById for ownership check
      expect(postsService.findById).not.toHaveBeenCalled();
    });

    it('should reject non-owner non-admin from updating', async () => {
      const post = { id: 1, title: 'My Post', authorId: 5 };
      postsService.findById!.mockResolvedValue(post);

      await expect(
        controller.update(1, { title: 'Hack' }, otherUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow owner to delete their own post', async () => {
      const post = { id: 1, title: 'My Post', authorId: 5 };
      postsService.findById!.mockResolvedValue(post);
      postsService.remove!.mockResolvedValue(undefined);

      await controller.remove(1, ownerUser);

      expect(postsService.remove).toHaveBeenCalledWith(1);
    });

    it('should allow admin to delete any post', async () => {
      postsService.remove!.mockResolvedValue(undefined);

      await controller.remove(1, adminUser);

      expect(postsService.remove).toHaveBeenCalledWith(1);
      expect(postsService.findById).not.toHaveBeenCalled();
    });

    it('should reject non-owner non-admin from deleting', async () => {
      const post = { id: 1, title: 'My Post', authorId: 5 };
      postsService.findById!.mockResolvedValue(post);

      await expect(controller.remove(1, otherUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
