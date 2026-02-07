import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PostsService } from './posts.service';
import { CreatePostDto } from './DTO/create-post.dto';
import { UpdatePostDto } from './DTO/update-post.dto';

@ApiTags('posts')
@Controller('posts')
@UseInterceptors(ClassSerializerInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: 'List published posts (public, paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated published posts (newest first)',
  })
  @Get()
  findPublished(@Query() paginationQuery: PaginationQueryDto) {
    return this.postsService.findPublished(paginationQuery);
  }

  @ApiOperation({ summary: 'List all posts including drafts (paginated)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of all posts',
  })
  @UseGuards(AuthGuard)
  @Get('all')
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.postsService.findAll(paginationQuery);
  }

  @ApiOperation({ summary: 'Get a post by ID (public)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Returns the post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findById(id);
  }

  @ApiOperation({ summary: 'Get a post by slug (public)' })
  @ApiParam({ name: 'slug', type: String })
  @ApiResponse({ status: 200, description: 'Returns the post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Create a new post (author from JWT)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Post created' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser('sub') authorId: number,
  ) {
    return this.postsService.create(createPostDto, authorId);
  }

  @ApiOperation({ summary: 'Update a post (owner or admin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Post updated' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not the post author or admin',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: { sub: number; role: string },
  ) {
    await this.assertOwnerOrAdmin(id, user);
    return this.postsService.update(id, updatePostDto);
  }

  @ApiOperation({ summary: 'Delete a post (owner or admin)' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Post deleted' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not the post author or admin',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @UseGuards(AuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { sub: number; role: string },
  ) {
    await this.assertOwnerOrAdmin(id, user);
    await this.postsService.remove(id);
  }

  /**
   * Checks that the current user is either the post author or an admin.
   * Throws ForbiddenException otherwise.
   */
  private async assertOwnerOrAdmin(
    postId: number,
    user: { sub: number; role: string },
  ): Promise<void> {
    if (user.role === 'admin') return;

    const post = await this.postsService.findById(postId);
    if (post.authorId !== user.sub) {
      throw new ForbiddenException(
        'Você só pode alterar/excluir seus próprios posts',
      );
    }
  }
}
