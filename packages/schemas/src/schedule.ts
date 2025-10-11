import { z } from 'zod';
import { IdSchema, DateTimeSchema } from './common';

export const ScheduleSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  workflowId: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  cron: z.string(),
  timezone: z.string().default('UTC'),
  enabled: z.boolean().default(true),
  input: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  createdBy: IdSchema,
  lastRunAt: DateTimeSchema.optional(),
  nextRunAt: DateTimeSchema.optional(),
  runCount: z.number().default(0),
  successCount: z.number().default(0),
  failureCount: z.number().default(0),
});

export const CreateScheduleRequestSchema = z.object({
  workflowId: IdSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  cron: z.string(),
  timezone: z.string().default('UTC'),
  enabled: z.boolean().default(true),
  input: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateScheduleRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  cron: z.string().optional(),
  timezone: z.string().optional(),
  enabled: z.boolean().optional(),
  input: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ScheduleListQuerySchema = z.object({
  orgId: IdSchema.optional(),
  workflowId: IdSchema.optional(),
  enabled: z.boolean().optional(),
  search: z.string().optional(),
  createdBy: IdSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const ScheduleTestRequestSchema = z.object({
  cron: z.string(),
  timezone: z.string().default('UTC'),
  from: DateTimeSchema.optional(),
  to: DateTimeSchema.optional(),
  limit: z.number().int().min(1).max(100).default(10),
});

export const ScheduleTestResponseSchema = z.object({
  valid: z.boolean(),
  nextRuns: z.array(DateTimeSchema),
  error: z.string().optional(),
});

export const ScheduleStatsSchema = z.object({
  total: z.number(),
  enabled: z.number(),
  disabled: z.number(),
  byWorkflow: z.array(z.object({
    workflowId: IdSchema,
    workflowName: z.string(),
    count: z.number(),
  })),
  byTimezone: z.array(z.object({
    timezone: z.string(),
    count: z.number(),
  })),
  avgRunCount: z.number().optional(),
  successRate: z.number().optional(),
  failureRate: z.number().optional(),
  timeRange: z.object({
    start: DateTimeSchema,
    end: DateTimeSchema,
  }),
});

export const ScheduleExecutionSchema = z.object({
  id: IdSchema,
  scheduleId: IdSchema,
  runId: IdSchema.optional(),
  scheduledAt: DateTimeSchema,
  executedAt: DateTimeSchema.optional(),
  status: z.enum(['scheduled', 'executed', 'failed', 'cancelled']),
  error: z.string().optional(),
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
});

export const ScheduleExecutionListQuerySchema = z.object({
  scheduleId: IdSchema.optional(),
  status: z.enum(['scheduled', 'executed', 'failed', 'cancelled']).optional(),
  scheduledAfter: DateTimeSchema.optional(),
  scheduledBefore: DateTimeSchema.optional(),
  executedAfter: DateTimeSchema.optional(),
  executedBefore: DateTimeSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type Schedule = z.infer<typeof ScheduleSchema>;
export type CreateScheduleRequest = z.infer<typeof CreateScheduleRequestSchema>;
export type UpdateScheduleRequest = z.infer<typeof UpdateScheduleRequestSchema>;
export type ScheduleListQuery = z.infer<typeof ScheduleListQuerySchema>;
export type ScheduleTestRequest = z.infer<typeof ScheduleTestRequestSchema>;
export type ScheduleTestResponse = z.infer<typeof ScheduleTestResponseSchema>;
export type ScheduleStats = z.infer<typeof ScheduleStatsSchema>;
export type ScheduleExecution = z.infer<typeof ScheduleExecutionSchema>;
export type ScheduleExecutionListQuery = z.infer<typeof ScheduleExecutionListQuerySchema>;