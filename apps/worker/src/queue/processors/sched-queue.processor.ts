import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { logger } from '@common/automation';
import { WorkflowService } from '../../workflow/workflow.service';

@Processor('sched-queue')
export class SchedQueueProcessor {
  constructor(
    private prisma: PrismaService,
    private workflowService: WorkflowService,
  ) {}

  @Process('execute-schedule')
  async executeSchedule(job: Job<{
    scheduleId: string;
    workflowId: string;
    input: any;
  }>) {
    const { scheduleId, workflowId, input } = job.data;

    logger.info(`Executing schedule ${scheduleId} for workflow ${workflowId}`);

    try {
      // Update schedule last run time
      await this.prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          runCount: { increment: 1 },
        },
      });

      // Create a new run
      const run = await this.prisma.run.create({
        data: {
          orgId: 'demo-org-1', // In real implementation, get from schedule
          workflowId,
          input: input || {},
          status: 'QUEUED',
          priority: 5,
          createdBy: 'system',
        },
      });

      // Queue the workflow execution
      await this.workflowService.executeWorkflow(run.id, workflowId, input);

      // Update schedule success count
      await this.prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          successCount: { increment: 1 },
        },
      });

      logger.info(`Schedule ${scheduleId} executed successfully`);

    } catch (error) {
      logger.error(`Schedule ${scheduleId} execution failed:`, error);
      
      // Update schedule failure count
      await this.prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          failureCount: { increment: 1 },
        },
      });
    }
  }

  @Process('calculate-next-run')
  async calculateNextRun(job: Job<{
    scheduleId: string;
    cron: string;
    timezone: string;
  }>) {
    const { scheduleId, cron, timezone } = job.data;

    logger.info(`Calculating next run for schedule ${scheduleId}`);

    try {
      // In a real implementation, you would use a proper cron parser
      // This is a simplified version
      const nextRunAt = this.calculateNextRunTime(cron, timezone);

      await this.prisma.schedule.update({
        where: { id: scheduleId },
        data: { nextRunAt },
      });

      logger.info(`Next run calculated for schedule ${scheduleId}: ${nextRunAt}`);

    } catch (error) {
      logger.error(`Failed to calculate next run for schedule ${scheduleId}:`, error);
    }
  }

  private calculateNextRunTime(cron: string, timezone: string): Date {
    // In a real implementation, you would use a proper cron parser
    // This is a simplified version that calculates the next hour
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    return nextHour;
  }
}