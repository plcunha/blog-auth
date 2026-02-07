import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { PostsModule } from '../src/posts/posts.module';
import { CategoriesModule } from '../src/categories/categories.module';
import { User } from '../src/users/users.entity';
import { Post as PostEntity } from '../src/posts/post.entity';
import { Category } from '../src/categories/category.entity';

const JWT_SECRET = 'e2e-crud-test-secret';

describe('CRUD (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let userId: number;
  let categoryId: number;
  let postId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET,
              JWT_REFRESH_SECRET: JWT_SECRET + '-refresh',
              JWT_EXPIRATION: '300s',
              JWT_REFRESH_EXPIRATION: '7d',
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User, PostEntity, Category],
          synchronize: true,
          dropSchema: true,
        }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
        AuthModule,
        UsersModule,
        PostsModule,
        CategoriesModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();

    // Seed: register admin user
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        username: 'admin',
        password: 'admin123',
      });
    const adminId = registerRes.body.id;

    // Manually promote to admin via direct DB update
    const dataSource = app.get(DataSource);
    await dataSource.getRepository(User).update(adminId, { role: 'admin' });

    // Login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = adminLogin.body.access_token;

    // Register regular user
    const userReg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Regular User',
        email: 'user@example.com',
        username: 'regularuser',
        password: 'user123456',
      });
    userId = userReg.body.id;

    // Login as regular user
    const userLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'regularuser', password: 'user123456' });
    userToken = userLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── CATEGORIES ─────────────────────────────────────────

  describe('Categories CRUD', () => {
    describe('POST /api/v1/categories (admin only)', () => {
      it('should create a category as admin', () => {
        return request(app.getHttpServer())
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Tecnologia', description: 'Posts de tecnologia' })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('Tecnologia');
            expect(res.body.description).toBe('Posts de tecnologia');
            expect(res.body).not.toHaveProperty('deletedAt');
            categoryId = res.body.id;
          });
      });

      it('should reject category creation by regular user (403)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ name: 'Esportes' })
          .expect(403);
      });

      it('should reject unauthenticated category creation (401)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/categories')
          .send({ name: 'Esportes' })
          .expect(401);
      });

      it('should reject duplicate category name (409)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Tecnologia' })
          .expect(409);
      });
    });

    describe('GET /api/v1/categories (public)', () => {
      it('should list categories without authentication', () => {
        return request(app.getHttpServer())
          .get('/api/v1/categories')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('page');
            expect(res.body).toHaveProperty('totalPages');
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          });
      });
    });

    describe('GET /api/v1/categories/:id (public)', () => {
      it('should get a category by ID', () => {
        return request(app.getHttpServer())
          .get(`/api/v1/categories/${categoryId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(categoryId);
            expect(res.body.name).toBe('Tecnologia');
          });
      });

      it('should return 404 for non-existent category', () => {
        return request(app.getHttpServer())
          .get('/api/v1/categories/9999')
          .expect(404);
      });
    });

    describe('PATCH /api/v1/categories/:id (admin only)', () => {
      it('should update a category as admin', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ description: 'Tecnologia e ciência' })
          .expect(200)
          .expect((res) => {
            expect(res.body.description).toBe('Tecnologia e ciência');
          });
      });

      it('should reject update by regular user (403)', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/categories/${categoryId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ description: 'Hacked!' })
          .expect(403);
      });

      it('should reject duplicate category name on update (409)', async () => {
        // Create a second category
        const res = await request(app.getHttpServer())
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Ciência', description: 'Posts de ciência' });
        const secondCategoryId = res.body.id;

        // Try to rename second category to the name of the first
        return request(app.getHttpServer())
          .patch(`/api/v1/categories/${secondCategoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Tecnologia' })
          .expect(409);
      });
    });
  });

  // ─── POSTS ──────────────────────────────────────────────

  describe('Posts CRUD', () => {
    describe('POST /api/v1/posts (authenticated)', () => {
      it('should create a post as regular user', () => {
        return request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Meu Primeiro Post',
            content: 'Conteúdo do post aqui...',
            slug: 'meu-primeiro-post',
            isPublished: true,
            categoryId,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.title).toBe('Meu Primeiro Post');
            expect(res.body.slug).toBe('meu-primeiro-post');
            expect(res.body.isPublished).toBe(true);
            expect(res.body.authorId).toBe(userId);
            expect(res.body).not.toHaveProperty('deletedAt');
            postId = res.body.id;
          });
      });

      it('should reject post creation without auth (401)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/posts')
          .send({ title: 'No Auth', content: 'Content' })
          .expect(401);
      });

      it('should reject duplicate slug (409)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Outro Post',
            content: 'Conteúdo',
            slug: 'meu-primeiro-post',
          })
          .expect(409);
      });

      it('should auto-generate slug from title', () => {
        return request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Post Com Título Acentuado',
            content: 'Conteúdo com acentos',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.slug).toBe('post-com-titulo-acentuado');
          });
      });
    });

    describe('GET /api/v1/posts (public — published only)', () => {
      it('should list published posts without auth', () => {
        return request(app.getHttpServer())
          .get('/api/v1/posts')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('total');
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            // All returned posts should be published
            res.body.data.forEach((post: any) => {
              expect(post.isPublished).toBe(true);
            });
          });
      });
    });

    describe('GET /api/v1/posts/all (authenticated — includes drafts)', () => {
      it('should list all posts with auth', () => {
        return request(app.getHttpServer())
          .get('/api/v1/posts/all')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.total).toBeGreaterThanOrEqual(2);
          });
      });

      it('should reject unauthenticated request (401)', () => {
        return request(app.getHttpServer())
          .get('/api/v1/posts/all')
          .expect(401);
      });
    });

    describe('GET /api/v1/posts/:id (public)', () => {
      it('should get a post by ID', () => {
        return request(app.getHttpServer())
          .get(`/api/v1/posts/${postId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(postId);
            expect(res.body.title).toBe('Meu Primeiro Post');
            // Author should not expose password
            if (res.body.author) {
              expect(res.body.author).not.toHaveProperty('password');
            }
          });
      });

      it('should return 404 for non-existent post', () => {
        return request(app.getHttpServer())
          .get('/api/v1/posts/9999')
          .expect(404);
      });
    });

    describe('GET /api/v1/posts/slug/:slug (public)', () => {
      it('should get a post by slug', () => {
        return request(app.getHttpServer())
          .get('/api/v1/posts/slug/meu-primeiro-post')
          .expect(200)
          .expect((res) => {
            expect(res.body.slug).toBe('meu-primeiro-post');
          });
      });

      it('should return 404 for non-existent slug', () => {
        return request(app.getHttpServer())
          .get('/api/v1/posts/slug/non-existent-slug')
          .expect(404);
      });
    });

    describe('PATCH /api/v1/posts/:id (owner or admin)', () => {
      it('should update own post as author', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/posts/${postId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ title: 'Meu Post Atualizado' })
          .expect(200)
          .expect((res) => {
            expect(res.body.title).toBe('Meu Post Atualizado');
          });
      });

      it('should update any post as admin', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/posts/${postId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ content: 'Conteúdo editado pelo admin' })
          .expect(200)
          .expect((res) => {
            expect(res.body.content).toBe('Conteúdo editado pelo admin');
          });
      });
    });

    describe('DELETE /api/v1/posts/:id (owner or admin)', () => {
      let tempPostId: number;

      beforeAll(async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Post Para Deletar',
            content: 'Será deletado',
            slug: 'post-para-deletar',
          });
        tempPostId = res.body.id;
      });

      it('should soft-delete own post as author (204)', () => {
        return request(app.getHttpServer())
          .delete(`/api/v1/posts/${tempPostId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(204);
      });

      it('should reject deletion without auth (401)', () => {
        return request(app.getHttpServer())
          .delete(`/api/v1/posts/${postId}`)
          .expect(401);
      });
    });
  });

  // ─── USERS (admin only) ────────────────────────────────

  describe('Users CRUD (admin only)', () => {
    describe('POST /api/v1/users (admin only)', () => {
      it('should reject unauthenticated user creation (401)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/users')
          .send({
            name: 'Hacker',
            email: 'hacker@evil.com',
            username: 'hacker',
            password: 'hack123456',
          })
          .expect(401);
      });

      it('should reject user creation by regular user (403)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'Hacker',
            email: 'hacker@evil.com',
            username: 'hacker',
            password: 'hack123456',
          })
          .expect(403);
      });
    });

    describe('GET /api/v1/users (admin only)', () => {
      it('should list users as admin', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body.total).toBeGreaterThanOrEqual(2);
            // Ensure passwords are not exposed
            res.body.data.forEach((user: any) => {
              expect(user).not.toHaveProperty('password');
              expect(user).not.toHaveProperty('deletedAt');
            });
          });
      });

      it('should reject user listing by regular user (403)', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });

      it('should reject unauthenticated user listing (401)', () => {
        return request(app.getHttpServer()).get('/api/v1/users').expect(401);
      });
    });

    describe('GET /api/v1/users/:id (admin only)', () => {
      it('should get a user by ID as admin', () => {
        return request(app.getHttpServer())
          .get(`/api/v1/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(userId);
            expect(res.body.username).toBe('regularuser');
            expect(res.body).not.toHaveProperty('password');
          });
      });

      it('should return 404 for non-existent user', () => {
        return request(app.getHttpServer())
          .get('/api/v1/users/9999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('PATCH /api/v1/users/:id (admin only)', () => {
      it('should update a user as admin', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated Name' })
          .expect(200)
          .expect((res) => {
            expect(res.body.name).toBe('Updated Name');
          });
      });
    });

    describe('DELETE /api/v1/users/:id (admin only)', () => {
      let tempUserId: number;

      beforeAll(async () => {
        // POST /users is now admin-only, so use adminToken
        const res = await request(app.getHttpServer())
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Temp User',
            email: 'temp@example.com',
            username: 'tempuser',
            password: 'temp123456',
          });
        tempUserId = res.body.id;
      });

      it('should soft-delete a user as admin (204)', () => {
        return request(app.getHttpServer())
          .delete(`/api/v1/users/${tempUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(204);
      });

      it('should reject deletion by regular user (403)', () => {
        return request(app.getHttpServer())
          .delete(`/api/v1/users/${userId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });
  });

  // ─── CATEGORY DELETE ───────────────────────────────────

  describe('Category Delete (admin only)', () => {
    let tempCategoryId: number;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Temp Category' });
      tempCategoryId = res.body.id;
    });

    it('should soft-delete a category as admin (204)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${tempCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should reject deletion by regular user (403)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
