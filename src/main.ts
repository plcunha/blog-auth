import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Fail-fast: abort if critical env vars are missing
  const jwtSecret = configService.get<string>('JWT_SECRET');
  if (!jwtSecret) {
    throw new Error(
      'Variável de ambiente JWT_SECRET é obrigatória — abortando inicialização',
    );
  }

  // Enable graceful shutdown hooks (SIGTERM, SIGINT)
  app.enableShutdownHooks();

  // Security: HTTP headers protection
  app.use(helmet());

  // Security: CORS configuration
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Global exception filter — consistent JSON error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor — logs every request + response time
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global validation pipe - enforces DTO validation on all endpoints
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Reject requests with unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Blog Auth API')
    .setDescription(
      'RESTful API for a blog platform with JWT authentication, user management, categories, and posts.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('categories', 'Blog categories')
    .addTag('posts', 'Blog posts')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`🚀 Application running on port ${port}`);
  logger.log(`📖 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
