import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { logger } from '@common/automation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Start the worker
  await app.init();

  const port = configService.get('PORT', 3002);
  await app.listen(port);

  logger.info(`🚀 Worker server running on port ${port}`);
  logger.info(`📊 Processing queues: ap-queue, sched-queue, triage-queue, calendar-queue, renewals-queue, accessreview-queue`);
}

bootstrap().catch((error) => {
  logger.error('Failed to start worker server:', error);
  process.exit(1);
});