import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { AuthGuard } from '../auth/auth.guard';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: Partial<Record<keyof PostsService, jest.Mock>>;

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
    it('should return published posts', async () => {
      const posts = [{ id: 1, title: 'Published', isPublished: true }];
      postsService.findPublished!.mockResolvedValue(posts);

      const result = await controller.findPublished();

      expect(result).toEqual(posts);
      expect(postsService.findPublished).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all posts (including drafts)', async () => {
      const posts = [
        { id: 1, title: 'Published', isPublished: true },
        { id: 2, title: 'Draft', isPublished: false },
      ];
      postsService.findAll!.mockResolvedValue(posts);

      const result = await controller.findAll();

      expect(result).toEqual(posts);
      expect(postsService.findAll).toHaveBeenCalled();
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
    it('should update and return the post', async () => {
      const dto = { title: 'Updated Title' };
      const updated = { id: 1, title: 'Updated Title' };
      postsService.update!.mockResolvedValue(updated);

      const result = await controller.update(1, dto);

      expect(result).toEqual(updated);
      expect(postsService.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should call remove on service', async () => {
      postsService.remove!.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(postsService.remove).toHaveBeenCalledWith(1);
    });
  });
});
