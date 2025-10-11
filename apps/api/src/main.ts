import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { logger } from '@common/automation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
    allowedHeaders: ['Authorization', 'x-correlation-id', 'content-type'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Enterprise Automation Platform API')
    .setDescription('API for automating corporate workflows across Finance, HR, Sales, Support, and more')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('orgs', 'Organization management')
    .addTag('connectors', 'Connector management')
    .addTag('workflows', 'Workflow management')
    .addTag('runs', 'Run management')
    .addTag('rules', 'Rule management')
    .addTag('approvals', 'Approval management')
    .addTag('schedules', 'Schedule management')
    .addTag('evidence', 'Evidence management')
    .addTag('dlq', 'Dead Letter Queue management')
    .addTag('webhooks', 'Webhook management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  logger.info(`🚀 API server running on port ${port}`);
  logger.info(`📚 API documentation available at http://localhost:${port}/docs`);
}

bootstrap().catch((error) => {
  logger.error('Failed to start API server:', error);
  process.exit(1);
});