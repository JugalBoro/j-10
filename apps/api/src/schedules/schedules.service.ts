import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  CreateScheduleRequest,
  UpdateScheduleRequest,
  ScheduleListQuery,
  ScheduleTestRequest,
  ScheduleTestResponseSchema,
  ScheduleStatsSchema,
} from '@schemas/automation';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async getSchedules(query: ScheduleListQuery) {
    const {
      orgId,
      workflowId,
      enabled,
      search,
      createdBy,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (workflowId) {
      where.workflowId = workflowId;
    }

    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    const [schedules, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              version: true,
            },
          },
        },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: schedules.map((schedule) => ({
        id: schedule.id,
        orgId: schedule.orgId,
        workflowId: schedule.workflowId,
        name: schedule.name,
        description: schedule.description,
        cron: schedule.cron,
        timezone: schedule.timezone,
        enabled: schedule.enabled,
        input: schedule.input,
        metadata: schedule.metadata,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        createdBy: schedule.createdBy,
        lastRunAt: schedule.lastRunAt,
        nextRunAt: schedule.nextRunAt,
        runCount: schedule.runCount,
        successCount: schedule.successCount,
        failureCount: schedule.failureCount,
        workflow: schedule.workflow,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getSchedule(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            version: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return {
      id: schedule.id,
      orgId: schedule.orgId,
      workflowId: schedule.workflowId,
      name: schedule.name,
      description: schedule.description,
      cron: schedule.cron,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
      input: schedule.input,
      metadata: schedule.metadata,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      createdBy: schedule.createdBy,
      lastRunAt: schedule.lastRunAt,
      nextRunAt: schedule.nextRunAt,
      runCount: schedule.runCount,
      successCount: schedule.successCount,
      failureCount: schedule.failureCount,
      workflow: schedule.workflow,
    };
  }

  async createSchedule(createScheduleDto: CreateScheduleRequest) {
    const {
      workflowId,
      name,
      description,
      cron,
      timezone,
      enabled,
      input,
      metadata,
    } = createScheduleDto;

    // Validate workflow exists
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Validate cron expression
    if (!this.isValidCronExpression(cron)) {
      throw new BadRequestException('Invalid cron expression');
    }

    // Calculate next run time
    const nextRunAt = this.calculateNextRun(cron, timezone);

    const schedule = await this.prisma.schedule.create({
      data: {
        workflowId,
        name,
        description,
        cron,
        timezone: timezone || 'UTC',
        enabled: enabled || true,
        input: input || {},
        metadata: metadata || {},
        nextRunAt,
        orgId: workflow.orgId,
        createdBy: 'admin-user-1', // In real implementation, get from user context
      },
    });

    logger.info(`Schedule ${name} created`);

    return {
      id: schedule.id,
      orgId: schedule.orgId,
      workflowId: schedule.workflowId,
      name: schedule.name,
      description: schedule.description,
      cron: schedule.cron,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
      input: schedule.input,
      metadata: schedule.metadata,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      createdBy: schedule.createdBy,
      lastRunAt: schedule.lastRunAt,
      nextRunAt: schedule.nextRunAt,
      runCount: schedule.runCount,
      successCount: schedule.successCount,
      failureCount: schedule.failureCount,
    };
  }

  async updateSchedule(id: string, updateScheduleDto: UpdateScheduleRequest) {
    const {
      name,
      description,
      cron,
      timezone,
      enabled,
      input,
      metadata,
    } = updateScheduleDto;

    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Validate cron expression if provided
    if (cron && !this.isValidCronExpression(cron)) {
      throw new BadRequestException('Invalid cron expression');
    }

    // Calculate next run time if cron or timezone changed
    let nextRunAt = schedule.nextRunAt;
    if (cron || timezone) {
      nextRunAt = this.calculateNextRun(cron || schedule.cron, timezone || schedule.timezone);
    }

    const updatedSchedule = await this.prisma.schedule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(cron && { cron }),
        ...(timezone && { timezone }),
        ...(enabled !== undefined && { enabled }),
        ...(input && { input }),
        ...(metadata && { metadata }),
        ...(nextRunAt && { nextRunAt }),
      },
    });

    logger.info(`Schedule ${id} updated`);

    return {
      id: updatedSchedule.id,
      orgId: updatedSchedule.orgId,
      workflowId: updatedSchedule.workflowId,
      name: updatedSchedule.name,
      description: updatedSchedule.description,
      cron: updatedSchedule.cron,
      timezone: updatedSchedule.timezone,
      enabled: updatedSchedule.enabled,
      input: updatedSchedule.input,
      metadata: updatedSchedule.metadata,
      createdAt: updatedSchedule.createdAt,
      updatedAt: updatedSchedule.updatedAt,
      createdBy: updatedSchedule.createdBy,
      lastRunAt: updatedSchedule.lastRunAt,
      nextRunAt: updatedSchedule.nextRunAt,
      runCount: updatedSchedule.runCount,
      successCount: updatedSchedule.successCount,
      failureCount: updatedSchedule.failureCount,
    };
  }

  async deleteSchedule(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.prisma.schedule.delete({
      where: { id },
    });

    logger.info(`Schedule ${id} deleted`);

    return { message: 'Schedule deleted successfully' };
  }

  async testSchedule(testDto: ScheduleTestRequest) {
    const { cron, timezone, from, to, limit = 10 } = testDto;

    if (!this.isValidCronExpression(cron)) {
      return {
        valid: false,
        nextRuns: [],
        error: 'Invalid cron expression',
      };
    }

    try {
      const nextRuns = this.calculateNextRuns(cron, timezone, from, to, limit);
      
      return {
        valid: true,
        nextRuns,
      };
    } catch (error) {
      return {
        valid: false,
        nextRuns: [],
        error: error.message,
      };
    }
  }

  async getScheduleStats(query: any) {
    const { orgId } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    const [total, enabled, disabled, byWorkflow, byTimezone, avgRunCount, successRate, failureRate] = await Promise.all([
      this.prisma.schedule.count({ where }),
      this.prisma.schedule.count({ where: { ...where, enabled: true } }),
      this.prisma.schedule.count({ where: { ...where, enabled: false } }),
      this.prisma.schedule.groupBy({
        by: ['workflowId'],
        where,
        _count: { workflowId: true },
      }),
      this.prisma.schedule.groupBy({
        by: ['timezone'],
        where,
        _count: { timezone: true },
      }),
      this.prisma.schedule.aggregate({
        where,
        _avg: { runCount: true },
      }),
      this.prisma.schedule.aggregate({
        where,
        _avg: { successCount: true },
      }),
      this.prisma.schedule.aggregate({
        where,
        _avg: { failureCount: true },
      }),
    ]);

    return {
      total,
      enabled,
      disabled,
      byWorkflow: byWorkflow.map(item => ({
        workflowId: item.workflowId,
        workflowName: `Workflow ${item.workflowId}`, // In real implementation, join with workflow table
        count: item._count.workflowId,
      })),
      byTimezone: byTimezone.map(item => ({
        timezone: item.timezone,
        count: item._count.timezone,
      })),
      avgRunCount: avgRunCount._avg.runCount,
      successRate: avgRunCount._avg.runCount > 0 ? (successRate._avg.successCount / avgRunCount._avg.runCount) * 100 : 0,
      failureRate: avgRunCount._avg.runCount > 0 ? (failureRate._avg.failureCount / avgRunCount._avg.runCount) * 100 : 0,
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    };
  }

  private isValidCronExpression(cron: string): boolean {
    // Basic cron validation - in a real implementation, you would use a proper cron parser
    const cronRegex = /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([012]?\d|3[01])) (\*|([0]?\d|1[0-2])) (\*|([0-6]))$/;
    return cronRegex.test(cron);
  }

  private calculateNextRun(cron: string, timezone: string): Date {
    // In a real implementation, you would use a proper cron parser
    // This is a simplified version that calculates the next hour
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    return nextHour;
  }

  private calculateNextRuns(cron: string, timezone: string, from?: string, to?: string, limit: number = 10): string[] {
    // In a real implementation, you would use a proper cron parser
    // This is a simplified version that generates mock next run times
    const runs: string[] = [];
    const start = from ? new Date(from) : new Date();
    const end = to ? new Date(to) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from start

    let current = new Date(start);
    while (runs.length < limit && current <= end) {
      runs.push(current.toISOString());
      current = new Date(current.getTime() + 60 * 60 * 1000); // Add 1 hour
    }

    return runs;
  }
}