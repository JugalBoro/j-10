import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ApQueueProcessor } from './processors/ap-queue.processor';
import { SchedQueueProcessor } from './processors/sched-queue.processor';
import { TriageQueueProcessor } from './processors/triage-queue.processor';
import { CalendarQueueProcessor } from './processors/calendar-queue.processor';
import { RenewalsQueueProcessor } from './processors/renewals-queue.processor';
import { AccessReviewQueueProcessor } from './processors/accessreview-queue.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'ap-queue' },
      { name: 'sched-queue' },
      { name: 'triage-queue' },
      { name: 'calendar-queue' },
      { name: 'renewals-queue' },
      { name: 'accessreview-queue' },
    ),
  ],
  providers: [
    ApQueueProcessor,
    SchedQueueProcessor,
    TriageQueueProcessor,
    CalendarQueueProcessor,
    RenewalsQueueProcessor,
    AccessReviewQueueProcessor,
  ],
  exports: [
    BullModule,
  ],
})
export class QueueModule {}