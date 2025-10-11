import { z } from 'zod';
import { IdSchema, DateTimeSchema } from './common';

export const EvidenceTypeSchema = z.enum([
  'document',
  'image',
  'video',
  'audio',
  'data',
  'log',
  'screenshot',
  'pdf',
  'excel',
  'csv',
  'json',
  'xml',
  'other',
]);

export const EvidenceSchema = z.object({
  id: IdSchema,
  runId: IdSchema,
  stepId: IdSchema.optional(),
  type: EvidenceTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  s3Key: z.string(),
  s3Bucket: z.string(),
  s3Region: z.string(),
  url: z.string().url(),
  size: z.number(),
  hash: z.string(),
  mimeType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: DateTimeSchema,
  createdBy: IdSchema.optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  expiresAt: DateTimeSchema.optional(),
});

export const CreateEvidenceRequestSchema = z.object({
  runId: IdSchema,
  stepId: IdSchema.optional(),
  type: EvidenceTypeSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  data: z.string(), // base64 encoded data
  mimeType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  expiresAt: DateTimeSchema.optional(),
});

export const EvidenceListQuerySchema = z.object({
  runId: IdSchema.optional(),
  stepId: IdSchema.optional(),
  type: EvidenceTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  createdAfter: DateTimeSchema.optional(),
  createdBefore: DateTimeSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const EvidenceDownloadRequestSchema = z.object({
  evidenceId: IdSchema,
  format: z.enum(['original', 'thumbnail', 'preview']).default('original'),
});

export const EvidenceDownloadResponseSchema = z.object({
  url: z.string().url(),
  expiresAt: DateTimeSchema,
  size: z.number(),
  mimeType: z.string(),
});

export const EvidenceStatsSchema = z.object({
  total: z.number(),
  totalSize: z.number(),
  byType: z.array(z.object({
    type: EvidenceTypeSchema,
    count: z.number(),
    size: z.number(),
  })),
  byRun: z.array(z.object({
    runId: IdSchema,
    count: z.number(),
    size: z.number(),
  })),
  avgSize: z.number().optional(),
  timeRange: z.object({
    start: DateTimeSchema,
    end: DateTimeSchema,
  }),
});

export const EvidenceArchiveRequestSchema = z.object({
  evidenceIds: z.array(IdSchema),
  reason: z.string().optional(),
});

export const EvidenceArchiveResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  archivedCount: z.number(),
});

export const EvidenceRestoreRequestSchema = z.object({
  evidenceIds: z.array(IdSchema),
});

export const EvidenceRestoreResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  restoredCount: z.number(),
});

export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type CreateEvidenceRequest = z.infer<typeof CreateEvidenceRequestSchema>;
export type EvidenceListQuery = z.infer<typeof EvidenceListQuerySchema>;
export type EvidenceDownloadRequest = z.infer<typeof EvidenceDownloadRequestSchema>;
export type EvidenceDownloadResponse = z.infer<typeof EvidenceDownloadResponseSchema>;
export type EvidenceStats = z.infer<typeof EvidenceStatsSchema>;
export type EvidenceArchiveRequest = z.infer<typeof EvidenceArchiveRequestSchema>;
export type EvidenceArchiveResponse = z.infer<typeof EvidenceArchiveResponseSchema>;
export type EvidenceRestoreRequest = z.infer<typeof EvidenceRestoreRequestSchema>;
export type EvidenceRestoreResponse = z.infer<typeof EvidenceRestoreResponseSchema>;