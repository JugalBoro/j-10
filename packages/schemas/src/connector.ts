import { z } from 'zod';
import { IdSchema, DateTimeSchema, JsonSchema } from './common';

export const ConnectorTypeSchema = z.enum([
  'slack',
  'gmail',
  'outlook',
  'google_calendar',
  'microsoft_calendar',
  'google_drive',
  'jira',
  'github',
  'salesforce',
  'hubspot',
  'zendesk',
  'workday',
  'erp',
  'webhook',
]);

export const ConnectorStatusSchema = z.enum([
  'active',
  'inactive',
  'error',
  'pending_auth',
  'rate_limited',
]);

export const ConnectorHealthSchema = z.object({
  status: ConnectorStatusSchema,
  lastChecked: DateTimeSchema,
  lastError: z.string().optional(),
  rateLimit: z.object({
    limit: z.number(),
    remaining: z.number(),
    resetAt: DateTimeSchema,
  }).optional(),
  latency: z.number().optional(),
});

export const ConnectorSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  type: ConnectorTypeSchema,
  name: z.string(),
  status: ConnectorStatusSchema,
  settings: JsonSchema,
  secretsKmsRef: z.string().optional(),
  health: ConnectorHealthSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  lastUsedAt: DateTimeSchema.optional(),
  isSandbox: z.boolean().default(false),
});

export const CreateConnectorRequestSchema = z.object({
  type: ConnectorTypeSchema,
  name: z.string().min(1),
  settings: JsonSchema,
  secrets: JsonSchema.optional(),
  isSandbox: z.boolean().default(false),
});

export const UpdateConnectorRequestSchema = z.object({
  name: z.string().min(1).optional(),
  settings: JsonSchema.optional(),
  secrets: JsonSchema.optional(),
  isSandbox: z.boolean().optional(),
});

export const ConnectorTestRequestSchema = z.object({
  settings: JsonSchema,
  secrets: JsonSchema.optional(),
});

export const ConnectorTestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  latency: z.number().optional(),
  error: z.string().optional(),
});

export const ConnectorInstallRequestSchema = z.object({
  type: ConnectorTypeSchema,
  redirectUri: z.string().url(),
  state: z.string().optional(),
});

export const ConnectorInstallResponseSchema = z.object({
  authUrl: z.string().url(),
  state: z.string(),
});

export const ConnectorCallbackRequestSchema = z.object({
  type: ConnectorTypeSchema,
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
});

export const ConnectorListQuerySchema = z.object({
  orgId: IdSchema.optional(),
  type: ConnectorTypeSchema.optional(),
  status: ConnectorStatusSchema.optional(),
  isSandbox: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const ConnectorRotateSecretsRequestSchema = z.object({
  secrets: JsonSchema,
});

export type ConnectorType = z.infer<typeof ConnectorTypeSchema>;
export type ConnectorStatus = z.infer<typeof ConnectorStatusSchema>;
export type ConnectorHealth = z.infer<typeof ConnectorHealthSchema>;
export type Connector = z.infer<typeof ConnectorSchema>;
export type CreateConnectorRequest = z.infer<typeof CreateConnectorRequestSchema>;
export type UpdateConnectorRequest = z.infer<typeof UpdateConnectorRequestSchema>;
export type ConnectorTestRequest = z.infer<typeof ConnectorTestRequestSchema>;
export type ConnectorTestResponse = z.infer<typeof ConnectorTestResponseSchema>;
export type ConnectorInstallRequest = z.infer<typeof ConnectorInstallRequestSchema>;
export type ConnectorInstallResponse = z.infer<typeof ConnectorInstallResponseSchema>;
export type ConnectorCallbackRequest = z.infer<typeof ConnectorCallbackRequestSchema>;
export type ConnectorListQuery = z.infer<typeof ConnectorListQuerySchema>;
export type ConnectorRotateSecretsRequest = z.infer<typeof ConnectorRotateSecretsRequestSchema>;