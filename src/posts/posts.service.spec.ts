import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from './posts.service';
import { Post } from './post.entity';

type MockRepository = Partial<Record<keyof Repository<Post>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('PostsService', () => {
  let service: PostsService;
  let repository: MockRepository;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all posts with relations', async () => {
      const posts = [{ id: 1, title: 'Test Post', author: {}, category: {} }];
      repository.find!.mockResolvedValue(posts);

      const result = await service.findAll();

      expect(result).toEqual(posts);
      expect(repository.find).toHaveBeenCalledWith({
        relations: ['author', 'category'],
      });
    });
  });

  describe('findPublished', () => {
    it('should return only published posts ordered by createdAt DESC', async () => {
      const posts = [{ id: 1, title: 'Published Post', isPublished: true }];
      repository.find!.mockResolvedValue(posts);

      const result = await service.findPublished();

      expect(result).toEqual(posts);
      expect(repository.find).toHaveBeenCalledWith({
        where: { isPublished: true },
        relations: ['author', 'category'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return a post by id', async () => {
      const post = { id: 1, title: 'Test Post' };
      repository.findOne!.mockResolvedValue(post);

      const result = await service.findById(1);

      expect(result).toEqual(post);
    });

    it('should throw NotFoundException when post not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a post by slug', async () => {
      const post = { id: 1, title: 'Test Post', slug: 'test-post' };
      repository.findOne!.mockResolvedValue(post);

      const result = await service.findBySlug('test-post');

      expect(result).toEqual(post);
    });

    it('should throw NotFoundException when slug not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a post with auto-generated slug', async () => {
      const dto = { title: 'Meu Primeiro Post', content: 'Conteúdo aqui' };
      repository.findOneBy!.mockResolvedValue(null);
      repository.create!.mockImplementation(
        (data: Record<string, unknown>) => ({ id: 1, ...data }),
      );
      repository.save!.mockImplementation((post: Record<string, unknown>) =>
        Promise.resolve({ ...post }),
      );

      const result = await service.create(dto, 1);

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Meu Primeiro Post',
          content: 'Conteúdo aqui',
          slug: 'meu-primeiro-post',
          authorId: 1,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
    });

    it('should create a post with a provided slug', async () => {
      const dto = {
        title: 'My Post',
        content: 'Content',
        slug: 'custom-slug',
      };
      repository.findOneBy!.mockResolvedValue(null);
      repository.create!.mockImplementation(
        (data: Record<string, unknown>) => ({ id: 1, ...data }),
      );
      repository.save!.mockImplementation((post: Record<string, unknown>) =>
        Promise.resolve({ ...post }),
      );

      await service.create(dto, 1);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'custom-slug' }),
      );
    });

    it('should throw ConflictException for duplicate slug', async () => {
      const dto = { title: 'Test', content: 'Content', slug: 'duplicate' };
      repository.findOneBy!.mockResolvedValue({ id: 2, slug: 'duplicate' });

      await expect(service.create(dto, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const existingPost = {
        id: 1,
        title: 'Old Title',
        slug: 'old-title',
        content: 'Old content',
      };
      repository.findOne!.mockResolvedValue(existingPost);
      repository.save!.mockImplementation((post: Record<string, unknown>) =>
        Promise.resolve({ ...post }),
      );

      const result = await service.update(1, { title: 'New Title' });

      expect(result.title).toBe('New Title');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when updating slug to a duplicate', async () => {
      const existingPost = { id: 1, title: 'Post', slug: 'original-slug' };
      repository.findOne!.mockResolvedValue(existingPost);
      repository.findOneBy!.mockResolvedValue({
        id: 2,
        slug: 'taken-slug',
      });

      await expect(service.update(1, { slug: 'taken-slug' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when updating non-existent post', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.update(999, { title: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a post', async () => {
      const post = { id: 1, title: 'To Delete' };
      repository.findOne!.mockResolvedValue(post);
      repository.remove!.mockResolvedValue(post);

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(post);
    });

    it('should throw NotFoundException when removing non-existent post', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
