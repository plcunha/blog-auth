import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

/**
 * TypeORM DataSource configuration for CLI operations (migrations, seeds)
 * This is separate from the runtime TypeORM configuration in app.module.ts
 */
export const AppDataSource = new DataSource({
  type: (process.env.DB_TYPE as 'mysql') || 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false, // Never use synchronize with migrations
  logging: process.env.NODE_ENV === 'development',
});
