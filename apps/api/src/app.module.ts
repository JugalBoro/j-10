import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrgsModule } from './orgs/orgs.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { RunsModule } from './runs/runs.module';
import { RulesModule } from './rules/rules.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { SchedulesModule } from './schedules/schedules.module';
import { EvidenceModule } from './evidence/evidence.module';
import { DlqModule } from './dlq/dlq.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { config } from '@common/automation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
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
    AuthModule,
    UsersModule,
    OrgsModule,
    ConnectorsModule,
    WorkflowsModule,
    RunsModule,
    RulesModule,
    ApprovalsModule,
    SchedulesModule,
    EvidenceModule,
    DlqModule,
    WebhooksModule,
    HealthModule,
  ],
})
export class AppModule {}