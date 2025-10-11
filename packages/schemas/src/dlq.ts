import { z } from 'zod';
import { IdSchema, DateTimeSchema, JsonSchema } from './common';

export const DLQMessageStatusSchema = z.enum([
  'pending',
  'processing',
  'replayed',
  'quarantined',
  'archived',
]);

export const DLQMessageSchema = z.object({
  id: IdSchema,
  queue: z.string(),
  payload: JsonSchema,
  error: z.string().optional(),
  firstSeenAt: DateTimeSchema,
  lastTriedAt: DateTimeSchema.optional(),
  tries: z.number().default(0),
  maxTries: z.number().default(3),
  status: DLQMessageStatusSchema.default('pending'),
  metadata: JsonSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  replayedAt: DateTimeSchema.optional(),
  quarantinedAt: DateTimeSchema.optional(),
  archivedAt: DateTimeSchema.optional(),
});

export const DLQListQuerySchema = z.object({
  queue: z.string().optional(),
  status: DLQMessageStatusSchema.optional(),
  createdAfter: DateTimeSchema.optional(),
  createdBefore: DateTimeSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const DLQReplayRequestSchema = z.object({
  messageIds: z.array(IdSchema),
  delay: z.number().optional(),
  maxTries: z.number().optional(),
});

export const DLQReplayResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  replayedCount: z.number(),
  failedCount: z.number(),
  errors: z.array(z.string()).optional(),
});

export const DLQQuarantineRequestSchema = z.object({
  messageIds: z.array(IdSchema),
  reason: z.string().optional(),
});

export const DLQQuarantineResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  quarantinedCount: z.number(),
});

export const DLQArchiveRequestSchema = z.object({
  messageIds: z.array(IdSchema),
  reason: z.string().optional(),
});

export const DLQArchiveResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  archivedCount: z.number(),
});

export const DLQExportRequestSchema = z.object({
  messageIds: z.array(IdSchema).optional(),
  queue: z.string().optional(),
  status: DLQMessageStatusSchema.optional(),
  format: z.enum(['json', 'csv']).default('json'),
  includePayload: z.boolean().default(true),
  includeError: z.boolean().default(true),
});

export const DLQExportResponseSchema = z.object({
  downloadUrl: z.string().url(),
  expiresAt: DateTimeSchema,
  recordCount: z.number(),
  fileSize: z.number(),
});

export const DLQStatsSchema = z.object({
  total: z.number(),
  byStatus: z.array(z.object({
    status: DLQMessageStatusSchema,
    count: z.number(),
  })),
  byQueue: z.array(z.object({
    queue: z.string(),
    count: z.number(),
  })),
  avgTries: z.number().optional(),
  oldestMessage: DateTimeSchema.optional(),
  newestMessage: DateTimeSchema.optional(),
  timeRange: z.object({
    start: DateTimeSchema,
    end: DateTimeSchema,
  }),
});

export const DLQRetryRequestSchema = z.object({
  messageId: IdSchema,
  delay: z.number().optional(),
});

export const DLQRetryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  retryAt: DateTimeSchema.optional(),
});

export const DLQDeleteRequestSchema = z.object({
  messageIds: z.array(IdSchema),
  reason: z.string().optional(),
});

export const DLQDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  deletedCount: z.number(),
});

export type DLQMessageStatus = z.infer<typeof DLQMessageStatusSchema>;
export type DLQMessage = z.infer<typeof DLQMessageSchema>;
export type DLQListQuery = z.infer<typeof DLQListQuerySchema>;
export type DLQReplayRequest = z.infer<typeof DLQReplayRequestSchema>;
export type DLQReplayResponse = z.infer<typeof DLQReplayResponseSchema>;
export type DLQQuarantineRequest = z.infer<typeof DLQQuarantineRequestSchema>;
export type DLQQuarantineResponse = z.infer<typeof DLQQuarantineResponseSchema>;
export type DLQArchiveRequest = z.infer<typeof DLQArchiveRequestSchema>;
export type DLQArchiveResponse = z.infer<typeof DLQArchiveResponseSchema>;
export type DLQExportRequest = z.infer<typeof DLQExportRequestSchema>;
export type DLQExportResponse = z.infer<typeof DLQExportResponseSchema>;
export type DLQStats = z.infer<typeof DLQStatsSchema>;
export type DLQRetryRequest = z.infer<typeof DLQRetryRequestSchema>;
export type DLQRetryResponse = z.infer<typeof DLQRetryResponseSchema>;
export type DLQDeleteRequest = z.infer<typeof DLQDeleteRequestSchema>;
export type DLQDeleteResponse = z.infer<typeof DLQDeleteResponseSchema>;