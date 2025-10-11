import { z } from 'zod';
import { IdSchema, DateTimeSchema, JsonSchema } from './common';

export const WorkflowStatusSchema = z.enum(['draft', 'active', 'paused', 'archived']);

export const WorkflowTriggerSchema = z.object({
  type: z.enum(['webhook', 'schedule', 'manual', 'event']),
  config: JsonSchema,
});

export const WorkflowStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  config: JsonSchema,
  onSuccess: z.string().optional(),
  onError: z.string().optional(),
  retry: z.object({
    maxAttempts: z.number().default(3),
    backoff: z.object({
      type: z.enum(['fixed', 'exponential']),
      delay: z.number(),
      maxDelay: z.number().optional(),
    }).optional(),
  }).optional(),
  timeout: z.number().optional(),
  requiresApproval: z.boolean().default(false),
});

export const WorkflowSpecSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  trigger: WorkflowTriggerSchema,
  steps: z.array(WorkflowStepSchema),
  variables: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: JsonSchema.optional(),
});

export const WorkflowSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  name: z.string(),
  version: z.string(),
  spec: WorkflowSpecSchema,
  status: WorkflowStatusSchema,
  enabled: z.boolean().default(true),
  createdBy: IdSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  lastRunAt: DateTimeSchema.optional(),
  runCount: z.number().default(0),
  successCount: z.number().default(0),
  failureCount: z.number().default(0),
  avgDuration: z.number().optional(),
});

export const CreateWorkflowRequestSchema = z.object({
  name: z.string().min(1),
  spec: WorkflowSpecSchema,
  enabled: z.boolean().default(true),
});

export const UpdateWorkflowRequestSchema = z.object({
  name: z.string().min(1).optional(),
  spec: WorkflowSpecSchema.optional(),
  status: WorkflowStatusSchema.optional(),
  enabled: z.boolean().optional(),
});

export const WorkflowListQuerySchema = z.object({
  orgId: IdSchema.optional(),
  status: WorkflowStatusSchema.optional(),
  enabled: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdBy: IdSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const WorkflowRunRequestSchema = z.object({
  workflowId: IdSchema,
  input: JsonSchema.optional(),
  idempotencyKey: z.string().optional(),
  priority: z.number().int().min(1).max(10).default(5),
});

export const WorkflowRunResponseSchema = z.object({
  runId: IdSchema,
  status: z.enum(['queued', 'running', 'succeeded', 'failed', 'needs_approval']),
  queuedAt: DateTimeSchema,
  estimatedStartAt: DateTimeSchema.optional(),
});

export const WorkflowTestRequestSchema = z.object({
  spec: WorkflowSpecSchema,
  input: JsonSchema.optional(),
  stepId: z.string().optional(),
});

export const WorkflowTestResponseSchema = z.object({
  success: z.boolean(),
  output: JsonSchema.optional(),
  error: z.string().optional(),
  duration: z.number(),
  steps: z.array(z.object({
    stepId: z.string(),
    status: z.enum(['pending', 'running', 'succeeded', 'failed']),
    output: JsonSchema.optional(),
    error: z.string().optional(),
    duration: z.number(),
  })),
});

export const WorkflowVersionSchema = z.object({
  id: IdSchema,
  workflowId: IdSchema,
  version: z.string(),
  spec: WorkflowSpecSchema,
  createdAt: DateTimeSchema,
  createdBy: IdSchema,
  isActive: z.boolean().default(false),
});

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;
export type WorkflowTrigger = z.infer<typeof WorkflowTriggerSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type WorkflowSpec = z.infer<typeof WorkflowSpecSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>;
export type WorkflowListQuery = z.infer<typeof WorkflowListQuerySchema>;
export type WorkflowRunRequest = z.infer<typeof WorkflowRunRequestSchema>;
export type WorkflowRunResponse = z.infer<typeof WorkflowRunResponseSchema>;
export type WorkflowTestRequest = z.infer<typeof WorkflowTestRequestSchema>;
export type WorkflowTestResponse = z.infer<typeof WorkflowTestResponseSchema>;
export type WorkflowVersion = z.infer<typeof WorkflowVersionSchema>;