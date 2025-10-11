import { z } from 'zod';
import { IdSchema, DateTimeSchema, JsonSchema } from './common';

export const ApprovalStateSchema = z.enum(['pending', 'approved', 'rejected', 'expired']);

export const ApprovalSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  runId: IdSchema,
  stepId: IdSchema.optional(),
  state: ApprovalStateSchema,
  actorId: IdSchema.optional(),
  reason: z.string().optional(),
  metadata: JsonSchema.optional(),
  createdAt: DateTimeSchema,
  actedAt: DateTimeSchema.optional(),
  expiresAt: DateTimeSchema.optional(),
  createdBy: IdSchema,
  approverEmail: z.string().email().optional(),
  approverName: z.string().optional(),
  slaHours: z.number().optional(),
  reminderSentAt: DateTimeSchema.optional(),
  reminderCount: z.number().default(0),
});

export const CreateApprovalRequestSchema = z.object({
  runId: IdSchema,
  stepId: IdSchema.optional(),
  approverEmail: z.string().email(),
  approverName: z.string().optional(),
  reason: z.string().optional(),
  metadata: JsonSchema.optional(),
  slaHours: z.number().optional(),
  expiresAt: DateTimeSchema.optional(),
});

export const UpdateApprovalRequestSchema = z.object({
  state: ApprovalStateSchema,
  reason: z.string().optional(),
  metadata: JsonSchema.optional(),
});

export const ApprovalListQuerySchema = z.object({
  orgId: IdSchema.optional(),
  runId: IdSchema.optional(),
  stepId: IdSchema.optional(),
  state: ApprovalStateSchema.optional(),
  actorId: IdSchema.optional(),
  approverEmail: z.string().email().optional(),
  createdAfter: DateTimeSchema.optional(),
  createdBefore: DateTimeSchema.optional(),
  expiresAfter: DateTimeSchema.optional(),
  expiresBefore: DateTimeSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const ApprovalActionRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  metadata: JsonSchema.optional(),
});

export const ApprovalActionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  approval: ApprovalSchema,
});

export const ApprovalReminderRequestSchema = z.object({
  approvalId: IdSchema,
  message: z.string().optional(),
});

export const ApprovalReminderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  sentAt: DateTimeSchema,
});

export const ApprovalStatsSchema = z.object({
  total: z.number(),
  pending: z.number(),
  approved: z.number(),
  rejected: z.number(),
  expired: z.number(),
  avgResponseTime: z.number().optional(),
  slaBreaches: z.number().default(0),
  byApprover: z.array(z.object({
    approverEmail: z.string(),
    count: z.number(),
    avgResponseTime: z.number().optional(),
  })),
  bySla: z.array(z.object({
    slaHours: z.number(),
    count: z.number(),
    breaches: z.number(),
  })),
  timeRange: z.object({
    start: DateTimeSchema,
    end: DateTimeSchema,
  }),
});

export const ApprovalTemplateSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  approverEmail: z.string().email(),
  approverName: z.string().optional(),
  slaHours: z.number().optional(),
  metadata: JsonSchema.optional(),
  isDefault: z.boolean().default(false),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  createdBy: IdSchema,
});

export const CreateApprovalTemplateRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  approverEmail: z.string().email(),
  approverName: z.string().optional(),
  slaHours: z.number().optional(),
  metadata: JsonSchema.optional(),
  isDefault: z.boolean().default(false),
});

export const UpdateApprovalTemplateRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  approverEmail: z.string().email().optional(),
  approverName: z.string().optional(),
  slaHours: z.number().optional(),
  metadata: JsonSchema.optional(),
  isDefault: z.boolean().optional(),
});

export type ApprovalState = z.infer<typeof ApprovalStateSchema>;
export type Approval = z.infer<typeof ApprovalSchema>;
export type CreateApprovalRequest = z.infer<typeof CreateApprovalRequestSchema>;
export type UpdateApprovalRequest = z.infer<typeof UpdateApprovalRequestSchema>;
export type ApprovalListQuery = z.infer<typeof ApprovalListQuerySchema>;
export type ApprovalActionRequest = z.infer<typeof ApprovalActionRequestSchema>;
export type ApprovalActionResponse = z.infer<typeof ApprovalActionResponseSchema>;
export type ApprovalReminderRequest = z.infer<typeof ApprovalReminderRequestSchema>;
export type ApprovalReminderResponse = z.infer<typeof ApprovalReminderResponseSchema>;
export type ApprovalStats = z.infer<typeof ApprovalStatsSchema>;
export type ApprovalTemplate = z.infer<typeof ApprovalTemplateSchema>;
export type CreateApprovalTemplateRequest = z.infer<typeof CreateApprovalTemplateRequestSchema>;
export type UpdateApprovalTemplateRequest = z.infer<typeof UpdateApprovalTemplateRequestSchema>;