import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ConnectorModule } from './connector/connector.module';
import { NotificationModule } from './notification/notification.module';
import { config } from '@common/automation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config],
    }),
    BullModule.forRoot({
      redis: {
        host: config.REDIS_URL.split('://')[1].split(':')[0],
        port: parseInt(config.REDIS_URL.split(':')[2] || '6379'),
        password: config.REDIS_URL.includes('@') 
          ? config.REDIS_URL.split('@')[0].split('://')[1] 
          : undefined,
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    QueueModule,
    WorkflowModule,
    ConnectorModule,
    NotificationModule,
  ],
})
export class AppModule {}