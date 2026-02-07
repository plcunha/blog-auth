# Blog Auth API

RESTful API for a blog platform built with **NestJS**, featuring JWT authentication with refresh tokens, role-based access control, and full CRUD for users, categories, and posts.

**Autor:** Joao Vitor Cunha dos Santos
**RA:** 21161106-2

---

## Tech Stack

- **NestJS 10** — Framework
- **TypeORM** — ORM (MySQL)
- **JWT** — Authentication (access + refresh tokens)
- **bcrypt** — Password hashing
- **class-validator** — Request validation
- **Swagger / OpenAPI** — API docs
- **Helmet** — Security headers
- **@nestjs/throttler** — Rate limiting
- **Docker Compose** — MySQL + Adminer
- **GitHub Actions** — CI pipeline (lint, test, build)

---

## Getting Started

```bash
# 1. Start the database
docker compose up -d

# 2. Install dependencies
npm install

# 3. Copy .env.example to .env and configure
cp .env.example .env

# 4. Seed the database (optional — creates admin + sample data)
npm run seed

# 5. Start in development mode
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`
Swagger docs at `http://localhost:3000/api/docs`

---

## Environment Variables

| Variable                 | Description                          | Default         |
| ------------------------ | ------------------------------------ | --------------- |
| `NODE_ENV`               | Environment (development/production) | `development`   |
| `PORT`                   | Server port                          | `3000`          |
| `DB_TYPE`                | Database type                        | `mysql`         |
| `DB_HOST`                | Database host                        | `localhost`     |
| `DB_PORT`                | Database port                        | `3306`          |
| `DB_USERNAME`            | Database user                        | —               |
| `DB_PASSWORD`            | Database password                    | —               |
| `DB_DATABASE`            | Database name                        | `blog`          |
| `JWT_SECRET`             | Secret key for access token signing  | — (required)    |
| `JWT_EXPIRATION`         | Access token expiration              | `3600s`         |
| `JWT_REFRESH_SECRET`     | Secret key for refresh token signing | — (recommended) |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration             | `7d`            |
| `CORS_ORIGIN`            | Allowed CORS origin                  | `*`             |

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth (`/auth`)

| Method | Endpoint         | Auth   | Description                             |
| ------ | ---------------- | ------ | --------------------------------------- |
| `POST` | `/auth/register` | Public | Create a new account                    |
| `POST` | `/auth/login`    | Public | Login (returns access + refresh tokens) |
| `POST` | `/auth/refresh`  | Public | Refresh tokens (returns new token pair) |
| `GET`  | `/auth/profile`  | JWT    | Get current user profile                |

### Users (`/users`) — Admin only (except registration)

| Method   | Endpoint     | Auth   | Description                |
| -------- | ------------ | ------ | -------------------------- |
| `GET`    | `/users`     | Admin  | List all users (paginated) |
| `GET`    | `/users/:id` | Admin  | Get user by ID             |
| `POST`   | `/users`     | Public | Register a new user        |
| `PATCH`  | `/users/:id` | Admin  | Update a user              |
| `DELETE` | `/users/:id` | Admin  | Delete a user              |

### Categories (`/categories`) — Write operations admin only

| Method   | Endpoint          | Auth   | Description                     |
| -------- | ----------------- | ------ | ------------------------------- |
| `GET`    | `/categories`     | Public | List all categories (paginated) |
| `GET`    | `/categories/:id` | Public | Get category by ID              |
| `POST`   | `/categories`     | Admin  | Create a category               |
| `PATCH`  | `/categories/:id` | Admin  | Update a category               |
| `DELETE` | `/categories/:id` | Admin  | Delete a category (soft)        |

### Posts (`/posts`) — Ownership enforced

| Method   | Endpoint            | Auth        | Description                      |
| -------- | ------------------- | ----------- | -------------------------------- |
| `GET`    | `/posts`            | Public      | List published posts (paginated) |
| `GET`    | `/posts/all`        | JWT         | List all posts including drafts  |
| `GET`    | `/posts/:id`        | Public      | Get post by ID                   |
| `GET`    | `/posts/slug/:slug` | Public      | Get post by slug                 |
| `POST`   | `/posts`            | JWT         | Create a post (author = you)     |
| `PATCH`  | `/posts/:id`        | Owner/Admin | Update a post                    |
| `DELETE` | `/posts/:id`        | Owner/Admin | Delete a post (soft)             |

### Health

| Method | Endpoint  | Auth   | Description  |
| ------ | --------- | ------ | ------------ |
| `GET`  | `/health` | Public | Health check |

---

## Authentication & Authorization

1. **Register** via `POST /api/v1/auth/register`
2. **Login** via `POST /api/v1/auth/login` — returns `{ access_token, refresh_token }`
3. **Use the access token** in the `Authorization: Bearer <token>` header
4. **Refresh tokens** via `POST /api/v1/auth/refresh` with `{ refresh_token }` in the body
5. **Roles**: New users get `role: "user"` by default. Only admins can manage users, categories (write), and override post ownership.

---

## Pagination

All list endpoints support pagination via query parameters:

```
GET /api/v1/posts?page=1&limit=20
```

Response format:

```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

## Security Features

- **Helmet** — HTTP security headers
- **CORS** — Configurable via `CORS_ORIGIN`
- **Rate Limiting** — 60 req/min globally; 5 req/min on login
- **Password Hashing** — bcrypt (10 rounds)
- **Input Validation** — DTOs with class-validator (whitelist + forbidNonWhitelisted)
- **Password Exclusion** — `@Exclude()` decorator prevents password leaks in responses
- **Role-Based Access Control** — `@Roles('admin')` + `RolesGuard`
- **Post Ownership** — Users can only modify/delete their own posts
- **Soft Deletes** — Posts and categories are soft-deleted (recoverable)
- **Fail-Fast Startup** — App refuses to start without `JWT_SECRET`

---

## Running Tests

```bash
# Unit tests (125 tests)
npm run test

# Unit tests with coverage (100% line coverage)
npm run test:cov

# E2E tests (57 tests — uses in-memory SQLite)
npm run test:e2e
```

---

## CI Pipeline

GitHub Actions runs on every push/PR to `main`:

1. **Lint** — ESLint
2. **Unit Tests** — 125 tests with coverage (Node 18, 20 & 22)
3. **E2E Tests** — 57 tests with in-memory SQLite (Node 18, 20 & 22)
4. **Build** — Production compilation
5. **Artifact** — Coverage report uploaded (7-day retention)

---

## Project Structure

```
src/
  auth/           # JWT auth, guards, decorators, login/register/refresh
  categories/     # Categories CRUD (admin write, soft-delete)
  common/         # Shared DTOs (pagination), filters, interceptors
  posts/          # Posts CRUD (ownership enforced, soft-delete)
  users/          # Users CRUD (admin management)
  app.module.ts   # Root module (ConfigModule, TypeORM, Throttler)
  main.ts         # Bootstrap (Helmet, CORS, Swagger, ValidationPipe)
  seed.ts         # Database seeder (admin user + sample data)
test/
  auth.e2e-spec.ts  # Auth flow E2E tests
  crud.e2e-spec.ts  # CRUD operations E2E tests
  app.e2e-spec.ts   # App bootstrap E2E tests
```
