import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  RunListQuery,
  RunRetryRequest,
  RunCancelRequest,
  RunLogsQuery,
  RunLogsResponseSchema,
  RunStatsSchema,
} from '@schemas/automation';

@Injectable()
export class RunsService {
  constructor(private prisma: PrismaService) {}

  async getRuns(query: RunListQuery) {
    const {
      orgId,
      workflowId,
      status,
      createdBy,
      tags,
      startedAfter,
      startedBefore,
      search,
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

    if (status) {
      where.status = status;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (startedAfter) {
      where.startedAt = {
        gte: new Date(startedAfter),
      };
    }

    if (startedBefore) {
      where.startedAt = {
        ...where.startedAt,
        lte: new Date(startedBefore),
      };
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [runs, total] = await Promise.all([
      this.prisma.run.findMany({
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
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          steps: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.run.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: runs.map((run) => ({
        id: run.id,
        orgId: run.orgId,
        workflowId: run.workflowId,
        status: run.status,
        input: run.input,
        output: run.output,
        error: run.error,
        idempotencyKey: run.idempotencyKey,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        duration: run.duration,
        createdBy: run.createdBy,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        priority: run.priority,
        tags: run.tags,
        metadata: run.metadata,
        workflow: run.workflow,
        creator: run.creator,
        steps: run.steps,
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

  async getRun(id: string) {
    const run = await this.prisma.run.findUnique({
      where: { id },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            version: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        steps: {
          orderBy: { createdAt: 'asc' },
        },
        evidence: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!run) {
      throw new NotFoundException('Run not found');
    }

    // Calculate metrics
    const totalSteps = run.steps.length;
    const completedSteps = run.steps.filter(step => step.status === 'SUCCEEDED').length;
    const failedSteps = run.steps.filter(step => step.status === 'FAILED').length;
    const avgStepDuration = run.steps.reduce((sum, step) => {
      if (step.startedAt && step.finishedAt) {
        return sum + (step.finishedAt.getTime() - step.startedAt.getTime());
      }
      return sum;
    }, 0) / totalSteps;

    return {
      run: {
        id: run.id,
        orgId: run.orgId,
        workflowId: run.workflowId,
        status: run.status,
        input: run.input,
        output: run.output,
        error: run.error,
        idempotencyKey: run.idempotencyKey,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
        duration: run.duration,
        createdBy: run.createdBy,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        priority: run.priority,
        tags: run.tags,
        metadata: run.metadata,
        steps: run.steps,
      },
      workflow: run.workflow,
      logs: [], // In real implementation, fetch from log service
      artifacts: run.evidence.map(evidence => ({
        id: evidence.id,
        name: evidence.name,
        type: evidence.type,
        url: evidence.url,
        size: evidence.size,
        createdAt: evidence.createdAt,
      })),
      metrics: {
        totalSteps,
        completedSteps,
        failedSteps,
        avgStepDuration: avgStepDuration || undefined,
        totalDuration: run.duration || undefined,
      },
    };
  }

  async retryRun(id: string, retryDto: RunRetryRequest) {
    const { fromStep, input, idempotencyKey } = retryDto;

    const run = await this.prisma.run.findUnique({
      where: { id },
    });

    if (!run) {
      throw new NotFoundException('Run not found');
    }

    if (run.status === 'RUNNING') {
      throw new BadRequestException('Cannot retry a running workflow');
    }

    // In a real implementation, you would:
    // 1. Create a new run with the same workflow
    // 2. Start from the specified step
    // 3. Use the provided input or original input

    const newRun = await this.prisma.run.create({
      data: {
        orgId: run.orgId,
        workflowId: run.workflowId,
        input: input || run.input,
        idempotencyKey: idempotencyKey || `retry-${id}-${Date.now()}`,
        priority: run.priority,
        tags: [...run.tags, 'retry'],
        metadata: {
          ...run.metadata,
          retryFrom: id,
          retryFromStep: fromStep,
        },
        createdBy: run.createdBy,
      },
    });

    logger.info(`Run ${id} retry initiated`);

    return {
      runId: newRun.id,
      status: 'queued',
      queuedAt: newRun.createdAt,
    };
  }

  async cancelRun(id: string, cancelDto: RunCancelRequest) {
    const { reason } = cancelDto;

    const run = await this.prisma.run.findUnique({
      where: { id },
    });

    if (!run) {
      throw new NotFoundException('Run not found');
    }

    if (run.status !== 'RUNNING' && run.status !== 'QUEUED') {
      throw new BadRequestException('Cannot cancel a completed run');
    }

    await this.prisma.run.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        finishedAt: new Date(),
        error: reason || 'Cancelled by user',
      },
    });

    logger.info(`Run ${id} cancelled`);

    return { message: 'Run cancelled successfully' };
  }

  async getRunLogs(id: string, query: RunLogsQuery) {
    const { stepId, level, since, limit = 100 } = query;

    const run = await this.prisma.run.findUnique({
      where: { id },
    });

    if (!run) {
      throw new NotFoundException('Run not found');
    }

    // In a real implementation, you would:
    // 1. Fetch logs from a log service (e.g., Elasticsearch, CloudWatch)
    // 2. Filter by stepId, level, and since timestamp
    // 3. Return paginated results

    const logs = [
      {
        id: 'log-1',
        stepId: stepId || 'step-1',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Workflow started',
        data: { workflowId: run.workflowId },
      },
      {
        id: 'log-2',
        stepId: stepId || 'step-1',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'info',
        message: 'Step completed successfully',
        data: { duration: 1000 },
      },
    ];

    return {
      logs: logs.slice(0, limit),
      hasMore: logs.length > limit,
      nextCursor: logs.length > limit ? 'next-cursor' : undefined,
    };
  }

  async getRunStats(query: any) {
    const { orgId, workflowId, startedAfter, startedBefore } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (workflowId) {
      where.workflowId = workflowId;
    }

    if (startedAfter) {
      where.startedAt = {
        gte: new Date(startedAfter),
      };
    }

    if (startedBefore) {
      where.startedAt = {
        ...where.startedAt,
        lte: new Date(startedBefore),
      };
    }

    const [total, byStatus, byWorkflow, avgDuration, successRate, failureRate] = await Promise.all([
      this.prisma.run.count({ where }),
      this.prisma.run.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.run.groupBy({
        by: ['workflowId'],
        where,
        _count: { workflowId: true },
        _avg: { duration: true },
      }),
      this.prisma.run.aggregate({
        where,
        _avg: { duration: true },
      }),
      this.prisma.run.count({
        where: { ...where, status: 'SUCCEEDED' },
      }),
      this.prisma.run.count({
        where: { ...where, status: 'FAILED' },
      }),
    ]);

    const totalRuns = total;
    const successCount = successRate;
    const failureCount = failureRate;

    return {
      total: totalRuns,
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      byWorkflow: byWorkflow.map(item => ({
        workflowId: item.workflowId,
        workflowName: `Workflow ${item.workflowId}`, // In real implementation, join with workflow table
        count: item._count.workflowId,
      })),
      avgDuration: avgDuration._avg.duration,
      successRate: totalRuns > 0 ? (successCount / totalRuns) * 100 : 0,
      failureRate: totalRuns > 0 ? (failureCount / totalRuns) * 100 : 0,
      timeRange: {
        start: startedAfter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: startedBefore || new Date().toISOString(),
      },
    };
  }
}