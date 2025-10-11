import { z } from 'zod';
import { IdSchema, DateTimeSchema, JsonSchema } from './common';

export const RunStatusSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'needs_approval',
  'timeout',
]);

export const RunStepStatusSchema = z.enum([
  'pending',
  'running',
  'succeeded',
  'failed',
  'skipped',
  'cancelled',
]);

export const RunStepSchema = z.object({
  id: IdSchema,
  runId: IdSchema,
  name: z.string(),
  status: RunStepStatusSchema,
  startedAt: DateTimeSchema.optional(),
  finishedAt: DateTimeSchema.optional(),
  logsUrl: z.string().url().optional(),
  artifactUrl: z.string().url().optional(),
  metrics: JsonSchema.optional(),
  error: z.string().optional(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  timeout: z.number().optional(),
  requiresApproval: z.boolean().default(false),
  approvalId: IdSchema.optional(),
});

export const RunSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  workflowId: IdSchema,
  status: RunStatusSchema,
  input: JsonSchema.optional(),
  output: JsonSchema.optional(),
  error: z.string().optional(),
  idempotencyKey: z.string().optional(),
  startedAt: DateTimeSchema.optional(),
  finishedAt: DateTimeSchema.optional(),
  duration: z.number().optional(),
  steps: z.array(RunStepSchema).default([]),
  createdBy: IdSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  priority: z.number().int().min(1).max(10).default(5),
  tags: z.array(z.string()).default([]),
  metadata: JsonSchema.optional(),
});

export const RunListQuerySchema = z.object({
  orgId: IdSchema.optional(),
  workflowId: IdSchema.optional(),
  status: RunStatusSchema.optional(),
  createdBy: IdSchema.optional(),
  tags: z.array(z.string()).optional(),
  startedAfter: DateTimeSchema.optional(),
  startedBefore: DateTimeSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const RunDetailResponseSchema = z.object({
  run: RunSchema,
  workflow: z.object({
    id: IdSchema,
    name: z.string(),
    version: z.string(),
  }),
  logs: z.array(z.object({
    stepId: IdSchema,
    timestamp: DateTimeSchema,
    level: z.enum(['debug', 'info', 'warn', 'error']),
    message: z.string(),
    data: JsonSchema.optional(),
  })).optional(),
  artifacts: z.array(z.object({
    id: IdSchema,
    name: z.string(),
    type: z.string(),
    url: z.string().url(),
    size: z.number(),
    createdAt: DateTimeSchema,
  })).optional(),
  metrics: z.object({
    totalSteps: z.number(),
    completedSteps: z.number(),
    failedSteps: z.number(),
    avgStepDuration: z.number().optional(),
    totalDuration: z.number().optional(),
  }).optional(),
});

export const RunRetryRequestSchema = z.object({
  fromStep: z.string().optional(),
  input: JsonSchema.optional(),
  idempotencyKey: z.string().optional(),
});

export const RunCancelRequestSchema = z.object({
  reason: z.string().optional(),
});

export const RunLogsQuerySchema = z.object({
  runId: IdSchema,
  stepId: IdSchema.optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  since: DateTimeSchema.optional(),
  limit: z.number().int().min(1).max(1000).default(100),
});

export const RunLogsResponseSchema = z.object({
  logs: z.array(z.object({
    id: IdSchema,
    stepId: IdSchema,
    timestamp: DateTimeSchema,
    level: z.enum(['debug', 'info', 'warn', 'error']),
    message: z.string(),
    data: JsonSchema.optional(),
  })),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
});

export const RunStatsSchema = z.object({
  total: z.number(),
  byStatus: z.record(z.number()),
  byWorkflow: z.array(z.object({
    workflowId: IdSchema,
    workflowName: z.string(),
    count: z.number(),
  })),
  avgDuration: z.number().optional(),
  successRate: z.number().optional(),
  failureRate: z.number().optional(),
  timeRange: z.object({
    start: DateTimeSchema,
    end: DateTimeSchema,
  }),
});

export type RunStatus = z.infer<typeof RunStatusSchema>;
export type RunStepStatus = z.infer<typeof RunStepStatusSchema>;
export type RunStep = z.infer<typeof RunStepSchema>;
export type Run = z.infer<typeof RunSchema>;
export type RunListQuery = z.infer<typeof RunListQuerySchema>;
export type RunDetailResponse = z.infer<typeof RunDetailResponseSchema>;
export type RunRetryRequest = z.infer<typeof RunRetryRequestSchema>;
export type RunCancelRequest = z.infer<typeof RunCancelRequestSchema>;
export type RunLogsQuery = z.infer<typeof RunLogsQuerySchema>;
export type RunLogsResponse = z.infer<typeof RunLogsResponseSchema>;
export type RunStats = z.infer<typeof RunStatsSchema>;