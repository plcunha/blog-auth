import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709350000000 implements MigrationInterface {
  name = 'InitialSchema1709350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`email\` varchar(150) NOT NULL,
        \`username\` varchar(50) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`role\` varchar(50) NOT NULL DEFAULT 'user',
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        UNIQUE INDEX \`IDX_users_username\` (\`username\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create categories table
    await queryRunner.query(`
      CREATE TABLE \`categories\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`description\` text NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        UNIQUE INDEX \`IDX_categories_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Create posts table
    await queryRunner.query(`
      CREATE TABLE \`posts\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(200) NOT NULL,
        \`content\` text NOT NULL,
        \`slug\` varchar(255) NOT NULL,
        \`isPublished\` tinyint NOT NULL DEFAULT 0,
        \`authorId\` int NOT NULL,
        \`categoryId\` int NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        UNIQUE INDEX \`IDX_posts_slug\` (\`slug\`),
        INDEX \`IDX_posts_authorId\` (\`authorId\`),
        INDEX \`IDX_posts_categoryId\` (\`categoryId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE \`posts\`
      ADD CONSTRAINT \`FK_posts_authorId\`
      FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`posts\`
      ADD CONSTRAINT \`FK_posts_categoryId\`
      FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`)
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_posts_categoryId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_posts_authorId\``,
    );

    // Drop tables
    await queryRunner.query(`DROP INDEX \`IDX_posts_categoryId\` ON \`posts\``);
    await queryRunner.query(`DROP INDEX \`IDX_posts_authorId\` ON \`posts\``);
    await queryRunner.query(`DROP INDEX \`IDX_posts_slug\` ON \`posts\``);
    await queryRunner.query(`DROP TABLE \`posts\``);

    await queryRunner.query(
      `DROP INDEX \`IDX_categories_name\` ON \`categories\``,
    );
    await queryRunner.query(`DROP TABLE \`categories\``);

    await queryRunner.query(`DROP INDEX \`IDX_users_username\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`IDX_users_email\` ON \`users\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
