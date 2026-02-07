import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './DTO/create-post.dto';
import { UpdatePostDto } from './DTO/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      relations: ['author', 'category'],
    });
  }

  async findPublished(): Promise<Post[]> {
    return this.postRepository.find({
      where: { isPublished: true },
      relations: ['author', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'category'],
    });

    if (!post) {
      throw new NotFoundException(`Post com id ${id} não encontrado`);
    }

    return post;
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { slug },
      relations: ['author', 'category'],
    });

    if (!post) {
      throw new NotFoundException(`Post com slug "${slug}" não encontrado`);
    }

    return post;
  }

  async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    // Auto-generate slug from title if not provided
    const slug = createPostDto.slug || this.generateSlug(createPostDto.title);

    // Check for duplicate slug
    const existingPost = await this.postRepository.findOneBy({ slug });
    if (existingPost) {
      throw new ConflictException(`Já existe um post com o slug "${slug}"`);
    }

    const post = this.postRepository.create({
      ...createPostDto,
      slug,
      authorId,
    });

    return this.postRepository.save(post);
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findById(id);

    // If slug is being updated, check for duplicates
    if (updatePostDto.slug && updatePostDto.slug !== post.slug) {
      const existingPost = await this.postRepository.findOneBy({
        slug: updatePostDto.slug,
      });
      if (existingPost) {
        throw new ConflictException(
          `Já existe um post com o slug "${updatePostDto.slug}"`,
        );
      }
    }

    // If title is updated and slug is not explicitly provided, regenerate slug
    if (updatePostDto.title && !updatePostDto.slug) {
      updatePostDto.slug = this.generateSlug(updatePostDto.title);
    }

    Object.assign(post, updatePostDto);
    return this.postRepository.save(post);
  }

  async remove(id: number): Promise<void> {
    const post = await this.findById(id);
    await this.postRepository.remove(post);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Trim hyphens from start/end
  }
}
