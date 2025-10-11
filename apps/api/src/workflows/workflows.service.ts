import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  CreateWorkflowRequestSchema,
  UpdateWorkflowRequestSchema,
  WorkflowListQuerySchema,
  WorkflowRunRequestSchema,
  WorkflowRunResponseSchema,
  WorkflowTestRequestSchema,
  WorkflowTestResponseSchema,
} from '@schemas/automation';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async getWorkflows(query: WorkflowListQuerySchema) {
    const {
      orgId,
      status,
      enabled,
      search,
      tags,
      createdBy,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (status) {
      where.status = status;
    }

    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { spec: { path: ['description'], string_contains: search } },
      ];
    }

    if (tags && tags.length > 0) {
      where.spec = {
        path: ['tags'],
        array_contains: tags,
      };
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    const [workflows, total] = await Promise.all([
      this.prisma.workflow.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          org: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.workflow.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: workflows.map((workflow) => ({
        id: workflow.id,
        orgId: workflow.orgId,
        name: workflow.name,
        version: workflow.version,
        spec: workflow.spec,
        status: workflow.status,
        enabled: workflow.enabled,
        createdBy: workflow.createdBy,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        lastRunAt: workflow.lastRunAt,
        runCount: workflow.runCount,
        successCount: workflow.successCount,
        failureCount: workflow.failureCount,
        avgDuration: workflow.avgDuration,
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

  async getWorkflow(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        org: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return {
      id: workflow.id,
      orgId: workflow.orgId,
      name: workflow.name,
      version: workflow.version,
      spec: workflow.spec,
      status: workflow.status,
      enabled: workflow.enabled,
      createdBy: workflow.createdBy,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      lastRunAt: workflow.lastRunAt,
      runCount: workflow.runCount,
      successCount: workflow.successCount,
      failureCount: workflow.failureCount,
      avgDuration: workflow.avgDuration,
    };
  }

  async createWorkflow(createWorkflowDto: CreateWorkflowRequestSchema) {
    const { name, spec, enabled } = createWorkflowDto;

    // Validate workflow spec
    if (!spec || !spec.steps || !Array.isArray(spec.steps)) {
      throw new BadRequestException('Invalid workflow spec');
    }

    const workflow = await this.prisma.workflow.create({
      data: {
        name,
        spec,
        enabled: enabled || true,
        orgId: 'demo-org-1', // In real implementation, get from user context
        createdBy: 'admin-user-1', // In real implementation, get from user context
      },
    });

    logger.info(`Workflow ${name} created`);

    return {
      id: workflow.id,
      orgId: workflow.orgId,
      name: workflow.name,
      version: workflow.version,
      spec: workflow.spec,
      status: workflow.status,
      enabled: workflow.enabled,
      createdBy: workflow.createdBy,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      lastRunAt: workflow.lastRunAt,
      runCount: workflow.runCount,
      successCount: workflow.successCount,
      failureCount: workflow.failureCount,
      avgDuration: workflow.avgDuration,
    };
  }

  async updateWorkflow(id: string, updateWorkflowDto: UpdateWorkflowRequestSchema) {
    const { name, spec, status, enabled } = updateWorkflowDto;

    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Validate workflow spec if provided
    if (spec && (!spec.steps || !Array.isArray(spec.steps))) {
      throw new BadRequestException('Invalid workflow spec');
    }

    const updatedWorkflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(spec && { spec }),
        ...(status && { status }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    logger.info(`Workflow ${id} updated`);

    return {
      id: updatedWorkflow.id,
      orgId: updatedWorkflow.orgId,
      name: updatedWorkflow.name,
      version: updatedWorkflow.version,
      spec: updatedWorkflow.spec,
      status: updatedWorkflow.status,
      enabled: updatedWorkflow.enabled,
      createdBy: updatedWorkflow.createdBy,
      createdAt: updatedWorkflow.createdAt,
      updatedAt: updatedWorkflow.updatedAt,
      lastRunAt: updatedWorkflow.lastRunAt,
      runCount: updatedWorkflow.runCount,
      successCount: updatedWorkflow.successCount,
      failureCount: updatedWorkflow.failureCount,
      avgDuration: updatedWorkflow.avgDuration,
    };
  }

  async deleteWorkflow(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    await this.prisma.workflow.delete({
      where: { id },
    });

    logger.info(`Workflow ${id} deleted`);

    return { message: 'Workflow deleted successfully' };
  }

  async runWorkflow(runDto: WorkflowRunRequestSchema) {
    const { workflowId, input, idempotencyKey, priority } = runDto;

    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (!workflow.enabled) {
      throw new BadRequestException('Workflow is disabled');
    }

    // Check idempotency
    if (idempotencyKey) {
      const existingRun = await this.prisma.run.findUnique({
        where: { idempotencyKey },
      });

      if (existingRun) {
        throw new BadRequestException('Run with this idempotency key already exists');
      }
    }

    // Create run
    const run = await this.prisma.run.create({
      data: {
        orgId: workflow.orgId,
        workflowId,
        input: input || {},
        idempotencyKey,
        priority: priority || 5,
        createdBy: 'admin-user-1', // In real implementation, get from user context
      },
    });

    // In a real implementation, you would:
    // 1. Queue the workflow execution
    // 2. Start the workflow engine
    // 3. Return the run details

    logger.info(`Workflow ${workflowId} run initiated`);

    return {
      runId: run.id,
      status: 'queued',
      queuedAt: run.createdAt,
      estimatedStartAt: new Date(Date.now() + 60000), // 1 minute from now
    };
  }

  async testWorkflow(testDto: WorkflowTestRequestSchema) {
    const { spec, input, stepId } = testDto;

    // Validate workflow spec
    if (!spec || !spec.steps || !Array.isArray(spec.steps)) {
      throw new BadRequestException('Invalid workflow spec');
    }

    const startTime = Date.now();
    const steps = [];

    try {
      // In a real implementation, you would:
      // 1. Execute the workflow steps in a sandbox environment
      // 2. Collect step results and logs
      // 3. Return detailed test results

      // Simulate step execution
      for (const step of spec.steps) {
        if (stepId && step.id !== stepId) {
          continue;
        }

        const stepStartTime = Date.now();
        
        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const stepDuration = Date.now() - stepStartTime;
        
        steps.push({
          stepId: step.id,
          status: 'succeeded',
          output: { message: 'Step executed successfully' },
          duration: stepDuration,
        });
      }

      const totalDuration = Date.now() - startTime;

      return {
        success: true,
        output: { message: 'Workflow test completed successfully' },
        duration: totalDuration,
        steps,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        steps,
      };
    }
  }
}