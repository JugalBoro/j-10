import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  CreateApprovalRequestSchema,
  UpdateApprovalRequestSchema,
  ApprovalListQuerySchema,
  ApprovalActionRequestSchema,
  ApprovalActionResponseSchema,
  ApprovalReminderRequestSchema,
  ApprovalReminderResponseSchema,
  ApprovalStatsSchema,
  type ApprovalListQuery,
  type CreateApprovalRequest,
  type UpdateApprovalRequest,
  type ApprovalActionRequest,
  type ApprovalReminderRequest,
} from '@schemas/automation';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  async getApprovals(query: ApprovalListQuery) {
    const {
      orgId,
      runId,
      stepId,
      state,
      actorId,
      approverEmail,
      createdAfter,
      createdBefore,
      expiresAfter,
      expiresBefore,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (runId) {
      where.runId = runId;
    }

    if (stepId) {
      where.stepId = stepId;
    }

    if (state) {
      where.state = state;
    }

    if (actorId) {
      where.actorId = actorId;
    }

    if (approverEmail) {
      where.approverEmail = approverEmail;
    }

    if (createdAfter) {
      where.createdAt = {
        gte: new Date(createdAfter),
      };
    }

    if (createdBefore) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(createdBefore),
      };
    }

    if (expiresAfter) {
      where.expiresAt = {
        gte: new Date(expiresAfter),
      };
    }

    if (expiresBefore) {
      where.expiresAt = {
        ...where.expiresAt,
        lte: new Date(expiresBefore),
      };
    }

    const [approvals, total] = await Promise.all([
      this.prisma.approval.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          run: {
            select: {
              id: true,
              workflowId: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.approval.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: approvals.map((approval) => ({
        id: approval.id,
        orgId: approval.orgId,
        runId: approval.runId,
        stepId: approval.stepId,
        state: approval.state,
        actorId: approval.actorId,
        reason: approval.reason,
        metadata: approval.metadata,
        createdAt: approval.createdAt,
        actedAt: approval.actedAt,
        expiresAt: approval.expiresAt,
        createdBy: approval.createdBy,
        approverEmail: approval.approverEmail,
        approverName: approval.approverName,
        slaHours: approval.slaHours,
        reminderSentAt: approval.reminderSentAt,
        reminderCount: approval.reminderCount,
        run: approval.run,
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

  async getApproval(id: string) {
    const approval = await this.prisma.approval.findUnique({
      where: { id },
      include: {
        run: {
          select: {
            id: true,
            workflowId: true,
            status: true,
          },
        },
      },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    return {
      id: approval.id,
      orgId: approval.orgId,
      runId: approval.runId,
      stepId: approval.stepId,
      state: approval.state,
      actorId: approval.actorId,
      reason: approval.reason,
      metadata: approval.metadata,
      createdAt: approval.createdAt,
      actedAt: approval.actedAt,
      expiresAt: approval.expiresAt,
      createdBy: approval.createdBy,
      approverEmail: approval.approverEmail,
      approverName: approval.approverName,
      slaHours: approval.slaHours,
      reminderSentAt: approval.reminderSentAt,
      reminderCount: approval.reminderCount,
      run: approval.run,
    };
  }

  async createApproval(createApprovalDto: CreateApprovalRequest) {
    const {
      runId,
      stepId,
      approverEmail,
      approverName,
      reason,
      metadata,
      slaHours,
      expiresAt,
    } = createApprovalDto;

    // Check if run exists
    const run = await this.prisma.run.findUnique({
      where: { id: runId },
    });

    if (!run) {
      throw new NotFoundException('Run not found');
    }

    // Check if approval already exists for this run/step
    const existingApproval = await this.prisma.approval.findFirst({
      where: {
        runId,
        stepId: stepId || null,
        state: 'PENDING',
      },
    });

    if (existingApproval) {
      throw new BadRequestException('Approval already exists for this run/step');
    }

    const approval = await this.prisma.approval.create({
      data: {
        runId,
        stepId,
        approverEmail,
        approverName,
        reason,
        metadata: metadata || {},
        slaHours,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        orgId: run.orgId,
        createdBy: 'admin-user-1', // In real implementation, get from user context
      },
    });

    // In a real implementation, you would:
    // 1. Send email notification to approver
    // 2. Create calendar reminder if SLA is set
    // 3. Update run status to NEEDS_APPROVAL

    logger.info(`Approval created for run ${runId}`);

    return {
      id: approval.id,
      orgId: approval.orgId,
      runId: approval.runId,
      stepId: approval.stepId,
      state: approval.state,
      actorId: approval.actorId,
      reason: approval.reason,
      metadata: approval.metadata,
      createdAt: approval.createdAt,
      actedAt: approval.actedAt,
      expiresAt: approval.expiresAt,
      createdBy: approval.createdBy,
      approverEmail: approval.approverEmail,
      approverName: approval.approverName,
      slaHours: approval.slaHours,
      reminderSentAt: approval.reminderSentAt,
      reminderCount: approval.reminderCount,
    };
  }

  async updateApproval(id: string, updateApprovalDto: UpdateApprovalRequest) {
    const { state, reason, metadata } = updateApprovalDto;

    const approval = await this.prisma.approval.findUnique({
      where: { id },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.state !== 'PENDING') {
      throw new BadRequestException('Cannot update a non-pending approval');
    }

    const updatedApproval = await this.prisma.approval.update({
      where: { id },
      data: {
        ...(state && { state }),
        ...(reason && { reason }),
        ...(metadata && { metadata }),
        ...(state && { actedAt: new Date() }),
      },
    });

    // If approved or rejected, update the run status
    if (state === 'approved' || state === 'rejected') {
      await this.prisma.run.update({
        where: { id: approval.runId },
        data: {
          status: state === 'approved' ? 'RUNNING' : 'FAILED',
          error: state === 'rejected' ? reason : null,
        },
      });
    }

    logger.info(`Approval ${id} updated to ${state}`);

    return {
      id: updatedApproval.id,
      orgId: updatedApproval.orgId,
      runId: updatedApproval.runId,
      stepId: updatedApproval.stepId,
      state: updatedApproval.state,
      actorId: updatedApproval.actorId,
      reason: updatedApproval.reason,
      metadata: updatedApproval.metadata,
      createdAt: updatedApproval.createdAt,
      actedAt: updatedApproval.actedAt,
      expiresAt: updatedApproval.expiresAt,
      createdBy: updatedApproval.createdBy,
      approverEmail: updatedApproval.approverEmail,
      approverName: updatedApproval.approverName,
      slaHours: updatedApproval.slaHours,
      reminderSentAt: updatedApproval.reminderSentAt,
      reminderCount: updatedApproval.reminderCount,
    };
  }

  async actionApproval(id: string, actionDto: ApprovalActionRequest) {
    const { action, reason, metadata } = actionDto;

    const approval = await this.prisma.approval.findUnique({
      where: { id },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.state !== 'PENDING') {
      throw new BadRequestException('Approval is not pending');
    }

    const newState = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updatedApproval = await this.prisma.approval.update({
      where: { id },
      data: {
        state: newState,
        reason,
        metadata: metadata || approval.metadata,
        actedAt: new Date(),
      },
    });

    // Update the run status
    await this.prisma.run.update({
      where: { id: approval.runId },
      data: {
        status: newState === 'APPROVED' ? 'RUNNING' : 'FAILED',
        error: newState === 'REJECTED' ? reason : null,
      },
    });

    logger.info(`Approval ${id} ${action}d`);

    return {
      success: true,
      message: `Approval ${action}d successfully`,
      approval: {
        id: updatedApproval.id,
        orgId: updatedApproval.orgId,
        runId: updatedApproval.runId,
        stepId: updatedApproval.stepId,
        state: updatedApproval.state,
        actorId: updatedApproval.actorId,
        reason: updatedApproval.reason,
        metadata: updatedApproval.metadata,
        createdAt: updatedApproval.createdAt,
        actedAt: updatedApproval.actedAt,
        expiresAt: updatedApproval.expiresAt,
        createdBy: updatedApproval.createdBy,
        approverEmail: updatedApproval.approverEmail,
        approverName: updatedApproval.approverName,
        slaHours: updatedApproval.slaHours,
        reminderSentAt: updatedApproval.reminderSentAt,
        reminderCount: updatedApproval.reminderCount,
      },
    };
  }

  async sendReminder(id: string, reminderDto: ApprovalReminderRequest) {
    const { message } = reminderDto;

    const approval = await this.prisma.approval.findUnique({
      where: { id },
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.state !== 'PENDING') {
      throw new BadRequestException('Cannot send reminder for non-pending approval');
    }

    // In a real implementation, you would:
    // 1. Send email reminder to approver
    // 2. Send Slack notification if configured
    // 3. Update reminder count and timestamp

    await this.prisma.approval.update({
      where: { id },
      data: {
        reminderCount: { increment: 1 },
        reminderSentAt: new Date(),
      },
    });

    logger.info(`Reminder sent for approval ${id}`);

    return {
      success: true,
      message: 'Reminder sent successfully',
      sentAt: new Date(),
    };
  }

  async getApprovalStats(query: any) {
    const { orgId, createdAfter, createdBefore } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (createdAfter) {
      where.createdAt = {
        gte: new Date(createdAfter),
      };
    }

    if (createdBefore) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(createdBefore),
      };
    }

    const [total, pending, approved, rejected, expired, byApprover, bySla] = await Promise.all([
      this.prisma.approval.count({ where }),
      this.prisma.approval.count({ where: { ...where, state: 'PENDING' } }),
      this.prisma.approval.count({ where: { ...where, state: 'APPROVED' } }),
      this.prisma.approval.count({ where: { ...where, state: 'REJECTED' } }),
      this.prisma.approval.count({ where: { ...where, state: 'EXPIRED' } }),
      this.prisma.approval.groupBy({
        by: ['approverEmail'],
        where,
        _count: { approverEmail: true },
        _avg: { reminderCount: true },
      }),
      this.prisma.approval.groupBy({
        by: ['slaHours'],
        where,
        _count: { slaHours: true },
      }),
    ]);

    // Calculate SLA breaches (approvals that exceeded their SLA)
    const slaBreaches = await this.prisma.approval.count({
      where: {
        ...where,
        state: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Calculate average response time
    const avgResponseTime = await this.prisma.approval.aggregate({
      where: {
        ...where,
        state: { in: ['APPROVED', 'REJECTED'] },
        actedAt: { not: null },
      },
      _avg: {
        reminderCount: true,
      },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      expired,
      avgResponseTime: avgResponseTime._avg.reminderCount,
      slaBreaches,
      byApprover: byApprover.map(item => ({
        approverEmail: item.approverEmail,
        count: item._count.approverEmail,
        avgResponseTime: item._avg.reminderCount,
      })),
      bySla: bySla.map(item => ({
        slaHours: item.slaHours,
        count: item._count.slaHours,
        breaches: 0, // In real implementation, calculate actual breaches
      })),
      timeRange: {
        start: createdAfter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: createdBefore || new Date().toISOString(),
      },
    };
  }
}