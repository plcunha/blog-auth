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
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { User } from '../src/users/users.entity';
import { Post } from '../src/posts/post.entity';
import { Category } from '../src/categories/category.entity';

const JWT_SECRET = 'e2e-test-secret';
const JWT_REFRESH_SECRET = 'e2e-test-refresh-secret';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET,
              JWT_REFRESH_SECRET,
              JWT_EXPIRATION: '300s',
              JWT_REFRESH_EXPIRATION: '7d',
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User, Post, Category],
          synchronize: true,
          dropSchema: true,
        }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
        AuthModule,
        UsersModule,
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
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'secret123',
  };

  let accessToken: string;
  let refreshToken: string;

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('username', testUser.username);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('name', testUser.name);
          expect(res.body).toHaveProperty('role', 'user');
          expect(res.body).toHaveProperty('isActive', true);
          // Password must NOT be in response
          expect(res.body).not.toHaveProperty('password');
          // deletedAt must NOT be in response
          expect(res.body).not.toHaveProperty('deletedAt');
        });
    });

    it('should reject duplicate username', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should reject duplicate email with different username', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          username: 'differentuser',
        })
        .expect(409);
    });

    it('should reject invalid payload (missing fields)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'x' })
        .expect(400);
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Bad Email',
          email: 'not-an-email',
          username: 'bademail',
          password: 'secret123',
        })
        .expect(400);
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Pass',
          email: 'shortpass@example.com',
          username: 'shortpass',
          password: '12345',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials and return tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(typeof res.body.access_token).toBe('string');
          expect(typeof res.body.refresh_token).toBe('string');
          accessToken = res.body.access_token;
          refreshToken = res.body.refresh_token;
        });
    });

    it('should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject non-existent username', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent',
          password: 'secret123',
        })
        .expect(401);
    });

    it('should reject empty payload', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return authenticated user profile', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('username', testUser.username);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('name', testUser.name);
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).not.toHaveProperty('deletedAt');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return new token pair with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(typeof res.body.access_token).toBe('string');
          expect(typeof res.body.refresh_token).toBe('string');
          // Update tokens for subsequent tests
          accessToken = res.body.access_token;
          refreshToken = res.body.refresh_token;
        });
    });

    it('should still work with the new access token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('username', testUser.username);
        });
    });

    it('should reject invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'invalid-refresh-token' })
        .expect(401);
    });

    it('should reject request without refresh_token field', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);
    });

    it('should reject access token used as refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: accessToken })
        .expect(401);
    });
  });

  describe('Full Auth Flow', () => {
    it('register → login → profile → refresh → profile (complete flow)', async () => {
      const newUser = {
        name: 'Flow User',
        email: 'flow@example.com',
        username: 'flowuser',
        password: 'flowpassword123',
      };

      // Step 1: Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(201);
      expect(registerRes.body.username).toBe(newUser.username);

      // Step 2: Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: newUser.username, password: newUser.password })
        .expect(200);
      const tokens = loginRes.body;

      // Step 3: Access profile with access_token
      const profileRes = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect(200);
      expect(profileRes.body.username).toBe(newUser.username);
      expect(profileRes.body.email).toBe(newUser.email);

      // Step 4: Refresh tokens
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: tokens.refresh_token })
        .expect(200);
      expect(refreshRes.body.access_token).toBeDefined();
      expect(refreshRes.body.refresh_token).toBeDefined();

      // Step 5: Access profile with new access_token
      const profileRes2 = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${refreshRes.body.access_token}`)
        .expect(200);
      expect(profileRes2.body.username).toBe(newUser.username);
    });
  });
});
