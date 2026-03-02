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
- **Docker Compose** — MySQL + Adminer + API
- **Docker** — Multi-stage production image (~180MB, non-root)
- **GitHub Actions** — CI pipeline (lint, test, build)

---

## Getting Started

```bash
# 1. Start the database
docker compose up -d database adminer

# 2. Install dependencies
npm install

# 3. Copy .env.example to .env and configure
cp .env.example .env

# 4. Run database migrations
npm run migration:run

# 5. Seed the database (optional — creates admin + sample data)
npm run seed

# 6. Start in development mode
npm run start:dev
```

### Docker (Production)

```bash
# Build and run everything (API + MySQL + Adminer)
docker compose up -d --build
```

The production image uses a multi-stage build (~180MB), runs as a non-root user, and includes a built-in health check.

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

| Method | Endpoint          | Auth   | Description                                |
| ------ | ----------------- | ------ | ------------------------------------------ |
| `GET`  | `/health`         | Public | Quick health check (no DB query)           |
| `GET`  | `/health/details` | Public | Detailed health check with DB connectivity |

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

## Database Migrations

This project uses **TypeORM migrations** for safe database schema management. Migrations are versioned SQL change scripts that run in order to evolve your database schema.

### Why Migrations?

- **Production Safety**: `synchronize: false` prevents TypeORM from auto-altering production schemas
- **Version Control**: All schema changes are tracked in Git
- **Rollback Support**: Migrations can be reverted if needed
- **Team Collaboration**: Everyone runs the same schema changes in order

### Running Migrations

```bash
# Run all pending migrations (also runs automatically in production)
npm run migration:run

# Check migration status
npm run migration:show

# Rollback the last migration (use with caution)
npm run migration:revert
```

**In production**: Migrations run automatically on startup (`migrationsRun: true` in `app.module.ts`).

### Creating New Migrations

When you modify an entity (e.g., add a field to `User`):

```bash
# 1. Make your changes to the entity file (e.g., users.entity.ts)

# 2. Start the database (required for migration generation)
docker compose up -d database

# 3. Generate migration from entity changes
npm run migration:generate src/database/migrations/AddUserPhoneNumber

# 4. Review the generated migration file in src/database/migrations/

# 5. Test the migration
npm run migration:run

# 6. Commit both the entity and migration files
git add src/users/users.entity.ts src/database/migrations/*AddUserPhoneNumber.ts
git commit -m "feat: add phone number to user entity"
```

### Creating Empty Migrations

For data migrations or complex schema changes:

```bash
# Create an empty migration template
npm run migration:create src/database/migrations/MigrateUserRoles

# Edit the file manually, then run it
npm run migration:run
```

### Migration Files

All migrations are stored in `src/database/migrations/` and compiled to `dist/database/migrations/` during build.

**Initial migration** (`1709350000000-InitialSchema.ts`) creates:

- `users` table with role-based access control
- `categories` table with soft-delete support
- `posts` table with author/category relationships
- Foreign keys with CASCADE and SET NULL behaviors
- Indexes on email, username, slug, and foreign keys

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
- **Fail-Fast Startup** — App refuses to start without `JWT_SECRET` and `JWT_REFRESH_SECRET`
- **Correlation IDs** — Every request gets/preserves an `X-Request-Id` header for traceability
- **Graceful Shutdown** — Proper cleanup on SIGTERM/SIGINT via shutdown hooks
- **Non-Root Docker** — Production container runs as unprivileged user
- **Migration-Only Schema Changes** — `synchronize: false` prevents accidental schema alterations

### Security Considerations

#### JWT Secrets

Both `JWT_SECRET` and `JWT_REFRESH_SECRET` **must** be set for the application to start. Generate cryptographically strong secrets:

```bash
# Generate a 512-bit random secret (recommended for production)
openssl rand -base64 64
```

Never use the example values from `.env.example` in production.

#### CORS Configuration

The default `CORS_ORIGIN=*` allows requests from any origin. **In production**, set this to your specific frontend domain:

```bash
CORS_ORIGIN=https://yourdomain.com
```

#### Refresh Token Security

Current implementation stores refresh tokens as JWTs (stateless). For enhanced security in production, consider implementing token revocation:

**Option A: Redis Blacklist**

- Store revoked token IDs in Redis with TTL
- Check blacklist on every refresh attempt

**Option B: Database Table**

- Create `refresh_tokens` table with `userId`, `tokenHash`, `expiresAt`
- Delete token on logout or password change
- Query DB on refresh to verify token validity

This allows forced logout on security events (password change, suspicious activity, etc.).

#### Dependency Vulnerabilities

As of the last audit, there are some remaining npm vulnerabilities:

- Most are in **dev dependencies** (webpack, @nestjs/cli) — low production risk
- One runtime issue in **multer** (file upload library) — not currently used in this API

Run `npm audit` regularly and apply fixes:

```bash
npm audit
npm audit fix
```

For vulnerabilities without automated fixes, evaluate the risk and consider:

- Updating to patched versions manually
- Finding alternative packages
- Accepting the risk if the vulnerable code path isn't used

---

## Production Deployment

### Required Environment Variables

Before deploying to production, ensure these variables are set:

| Variable             | Required | Production Recommendation                          |
| -------------------- | -------- | -------------------------------------------------- |
| `JWT_SECRET`         | ✅ Yes   | 512-bit random string (`openssl rand -base64 64`)  |
| `JWT_REFRESH_SECRET` | ✅ Yes   | 512-bit random string (different from JWT_SECRET)  |
| `DB_HOST`            | ✅ Yes   | Production database hostname                       |
| `DB_USERNAME`        | ✅ Yes   | Database user with appropriate permissions         |
| `DB_PASSWORD`        | ✅ Yes   | Strong database password                           |
| `DB_DATABASE`        | ✅ Yes   | Production database name                           |
| `CORS_ORIGIN`        | ✅ Yes   | Your frontend domain (e.g., `https://example.com`) |
| `NODE_ENV`           | ⚠️ Yes   | Must be `production`                               |
| `PORT`               | No       | Defaults to `3000`                                 |

### Secrets Management

**Do not** hardcode secrets in your deployment configuration. Use a secrets manager:

- **AWS**: AWS Secrets Manager or AWS Systems Manager Parameter Store
- **GCP**: Google Secret Manager
- **Azure**: Azure Key Vault
- **Kubernetes**: Kubernetes Secrets with encryption at rest
- **HashiCorp Vault**: For multi-cloud or on-premises deployments

### Database Migration Strategy

Migrations run **automatically on application startup** in production (`migrationsRun: true`).

**Deployment workflow:**

1. **Pre-deployment**: Review pending migrations

   ```bash
   npm run migration:show
   ```

2. **Deploy**: Start the application
   - Migrations run automatically before accepting traffic
   - Application fails to start if migrations fail (safe)

3. **Verify**: Check logs for migration success
   ```
   [TypeORM] Migration 1709350000000-InitialSchema has been executed successfully
   ```

**For zero-downtime deployments**, run migrations separately before deploying:

```bash
# On your deployment server or in a pre-deploy job
npm run migration:run
```

Then deploy the application code with `migrationsRun: false` in production.

### Database Backups

Implement a backup strategy before running in production:

- **Automated backups**: Daily full backups, hourly incremental
- **Retention policy**: Keep 30 days of backups minimum
- **Test restores**: Regularly verify backup integrity
- **Point-in-time recovery**: Enable binary logging in MySQL for transaction-level recovery

**Example backup command:**

```bash
# MySQL backup
mysqldump -u $DB_USERNAME -p$DB_PASSWORD $DB_DATABASE \
  --single-transaction \
  --routines \
  --triggers \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Health Checks

The API provides two health check endpoints:

- **Fast check** (no DB query): `GET /health`
  - Use for load balancer health checks
  - Returns 200 OK if app is running

- **Detailed check** (with DB): `GET /health/details`
  - Use for monitoring and alerting
  - Returns DB connection status and detailed metrics

**Example Docker health check** (already configured):

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

### Deployment Checklist

Before going to production:

- [ ] Generate strong JWT secrets with `openssl rand -base64 64`
- [ ] Set `CORS_ORIGIN` to your frontend domain (not `*`)
- [ ] Configure secrets manager (AWS Secrets Manager, etc.)
- [ ] Set up database backups with retention policy
- [ ] Test database restore procedure
- [ ] Review and run pending migrations
- [ ] Configure monitoring and alerting (CPU, memory, error rate)
- [ ] Set up log aggregation (CloudWatch, Datadog, ELK stack)
- [ ] Enable HTTPS/TLS for API (use reverse proxy like nginx)
- [ ] Test health check endpoints
- [ ] Configure rate limiting based on expected traffic
- [ ] Document rollback procedure
- [ ] Test rollback with staging environment

### Monitoring Recommendations

**Metrics to track:**

- Request rate (requests/second)
- Error rate (4xx, 5xx responses)
- Response latency (p50, p95, p99)
- Database connection pool usage
- CPU and memory usage
- JWT token validation failures (potential attacks)

**Logging:**

- All requests are logged via `LoggingInterceptor`
- Correlation IDs in `X-Request-Id` header for request tracing
- Consider structured logging (JSON format) for better parsing

**Alerting:**

- High error rate (>5% 5xx responses)
- High response latency (p95 > 1000ms)
- Database connection failures
- Health check failures
- Disk space low (migrations need disk space)

---

## Running Tests

```bash
# Unit tests (131 tests)
npm run test

# Unit tests with coverage (100% line coverage)
npm run test:cov

# E2E tests (58 tests — uses in-memory SQLite)
npm run test:e2e
```

---

## CI Pipeline

GitHub Actions runs on every push/PR to `main`:

1. **Lint** — ESLint
2. **Unit Tests** — 131 tests with coverage (Node 18, 20 & 22)
3. **E2E Tests** — 58 tests with in-memory SQLite (Node 18, 20 & 22)
4. **Build** — Production compilation
5. **Artifact** — Coverage report uploaded (7-day retention)

---

## Project Structure

```
src/
  auth/           # JWT auth, guards, decorators, login/register/refresh
  categories/     # Categories CRUD (admin write, soft-delete)
  common/         # Shared DTOs (pagination), filters, interceptors, middleware
  posts/          # Posts CRUD (ownership enforced, soft-delete)
  users/          # Users CRUD (admin management)
  app.module.ts   # Root module (ConfigModule, TypeORM, Throttler, middleware)
  main.ts         # Bootstrap (Helmet, CORS, Swagger, ValidationPipe, shutdown hooks)
  seed.ts         # Database seeder (admin user + sample data)
test/
  auth.e2e-spec.ts  # Auth flow E2E tests
  crud.e2e-spec.ts  # CRUD operations E2E tests
  app.e2e-spec.ts   # App bootstrap E2E tests
```
