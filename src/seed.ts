import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

/**
 * Seed script — creates an initial admin user if one doesn't exist.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/seed.ts
 */
async function seed() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const usersService = app.get(UsersService);

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@blog.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existing = await usersService.findByUsername(adminUsername);
    if (existing) {
      logger.log(`Admin user "${adminUsername}" already exists — skipping.`);
    } else {
      await usersService.create({
        name: 'Administrator',
        email: adminEmail,
        username: adminUsername,
        password: adminPassword,
      });

      // Manually set the role to admin (since create() defaults to 'user')
      const admin = await usersService.findByUsername(adminUsername);
      if (admin) {
        await usersService.update(admin.id, { role: 'admin' } as any);
        logger.log(
          `✅ Admin user created: username="${adminUsername}", email="${adminEmail}"`,
        );
      }
    }
  } catch (error) {
    logger.error('Seed failed', error);
  } finally {
    await app.close();
  }
}

seed();
