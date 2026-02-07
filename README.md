# Blog Auth API

RESTful API for a blog platform built with **NestJS**, featuring JWT authentication, role-based access control, and full CRUD for users, categories, and posts.

**Autor:** Joao Vitor Cunha dos Santos  
**RA:** 21161106-2

---

## Tech Stack

- **NestJS 10** — Framework
- **TypeORM** — ORM (MySQL)
- **Passport + JWT** — Authentication
- **bcrypt** — Password hashing
- **class-validator** — Request validation
- **Swagger / OpenAPI** — API docs
- **Helmet** — Security headers
- **@nestjs/throttler** — Rate limiting
- **Docker Compose** — MySQL + Adminer

---

## Getting Started

```bash
# 1. Start the database
docker compose up -d

# 2. Install dependencies
npm install

# 3. Copy .env.example to .env and configure
cp .env.example .env

# 4. Start in development mode
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`  
Swagger docs at `http://localhost:3000/api/docs`

---

## Environment Variables

| Variable         | Description                          | Default       |
| ---------------- | ------------------------------------ | ------------- |
| `NODE_ENV`       | Environment (development/production) | `development` |
| `PORT`           | Server port                          | `3000`        |
| `DB_TYPE`        | Database type                        | `mysql`       |
| `DB_HOST`        | Database host                        | `localhost`   |
| `DB_PORT`        | Database port                        | `3306`        |
| `DB_USERNAME`    | Database user                        | —             |
| `DB_PASSWORD`    | Database password                    | —             |
| `DB_DATABASE`    | Database name                        | `blog`        |
| `JWT_SECRET`     | Secret key for JWT signing           | —             |
| `JWT_EXPIRATION` | JWT token expiration                 | `3600s`       |
| `CORS_ORIGIN`    | Allowed CORS origin                  | `*`           |

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth (`/auth`)

| Method | Endpoint         | Auth   | Description              |
| ------ | ---------------- | ------ | ------------------------ |
| `POST` | `/auth/register` | Public | Create a new account     |
| `POST` | `/auth/login`    | Public | Login (returns JWT)      |
| `GET`  | `/auth/profile`  | JWT    | Get current user profile |

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
| `DELETE` | `/categories/:id` | Admin  | Delete a category               |

### Posts (`/posts`) — Ownership enforced

| Method   | Endpoint            | Auth        | Description                      |
| -------- | ------------------- | ----------- | -------------------------------- |
| `GET`    | `/posts`            | Public      | List published posts (paginated) |
| `GET`    | `/posts/all`        | JWT         | List all posts including drafts  |
| `GET`    | `/posts/:id`        | Public      | Get post by ID                   |
| `GET`    | `/posts/slug/:slug` | Public      | Get post by slug                 |
| `POST`   | `/posts`            | JWT         | Create a post (author = you)     |
| `PATCH`  | `/posts/:id`        | Owner/Admin | Update a post                    |
| `DELETE` | `/posts/:id`        | Owner/Admin | Delete a post                    |

### Health

| Method | Endpoint  | Auth   | Description  |
| ------ | --------- | ------ | ------------ |
| `GET`  | `/health` | Public | Health check |

---

## Authentication & Authorization

1. **Register** via `POST /api/v1/auth/register`
2. **Login** via `POST /api/v1/auth/login` — returns `{ access_token: "..." }`
3. **Use the token** in the `Authorization: Bearer <token>` header
4. **Roles**: New users get `role: "user"` by default. Only admins can manage users, categories (write), and override post ownership.

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

---

## Running Tests

```bash
# Unit tests (64 tests)
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

---

## Project Structure

```
src/
  auth/           # JWT auth, guards, decorators, login/register
  categories/     # Categories CRUD (admin write)
  common/         # Shared DTOs (pagination)
  posts/          # Posts CRUD (ownership enforced)
  users/          # Users CRUD (admin management)
  app.module.ts   # Root module (ConfigModule, TypeORM, Throttler)
  main.ts         # Bootstrap (Helmet, CORS, Swagger, ValidationPipe)
test/
  app.e2e-spec.ts # E2E tests
```
