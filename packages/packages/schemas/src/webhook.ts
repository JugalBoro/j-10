import { z } from 'zod';
import { IdSchema, DateTimeSchema, JsonSchema, WebhookSignatureSchema } from './common';

export const WebhookSourceSchema = z.enum([
  'gmail',
  'outlook',
  'slack',
  'jira',
  'github',
  'salesforce',
  'hubspot',
  'zendesk',
  'calendar',
  'drive',
  'custom',
]);

export const WebhookEventSchema = z.enum([
  'email.received',
  'email.sent',
  'email.replied',
  'slack.message',
  'slack.reaction',
  'jira.issue.created',
  'jira.issue.updated',
  'jira.issue.deleted',
  'github.push',
  'github.pull_request',
  'salesforce.lead',
  'salesforce.opportunity',
  'hubspot.contact',
  'hubspot.deal',
  'zendesk.ticket',
  'calendar.event',
  'drive.file',
  'custom',
]);

export const WebhookSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  source: WebhookSourceSchema,
  event: WebhookEventSchema,
  url: z.string().url(),
  secret: z.string(),
  enabled: z.boolean().default(true),
  metadata: JsonSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  createdBy: IdSchema,
  lastTriggeredAt: DateTimeSchema.optional(),
  triggerCount: z.number().default(0),
  successCount: z.number().default(0),
  failureCount: z.number().default(0),
});

export const CreateWebhookRequestSchema = z.object({
  source: WebhookSourceSchema,
  event: WebhookEventSchema,
  url: z.string().url(),
  secret: z.string().optional(),
  enabled: z.boolean().default(true),
  metadata: JsonSchema.optional(),
});

export const UpdateWebhookRequestSchema = z.object({
  url: z.string().url().optional(),
  secret: z.string().optional(),
  enabled: z.boolean().optional(),
  metadata: JsonSchema.optional(),
});

export const WebhookListQuerySchema = z.object({
  orgId: IdSchema.optional(),
  source: WebhookSourceSchema.optional(),
  event: WebhookEventSchema.optional(),
  enabled: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const WebhookTestRequestSchema = z.object({
  webhookId: IdSchema,
  payload: JsonSchema.optional(),
});

export const WebhookTestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  response: z.object({
    status: z.number(),
    headers: z.record(z.string()),
    body: z.string(),
  }).optional(),
  error: z.string().optional(),
});

export const WebhookDeliverySchema = z.object({
  id: IdSchema,
  webhookId: IdSchema,
  event: WebhookEventSchema,
  payload: JsonSchema,
  signature: WebhookSignatureSchema,
  status: z.enum(['pending', 'delivered', 'failed', 'retrying']),
  response: z.object({
    status: z.number(),
    headers: z.record(z.string()),
    body: z.string(),
  }).optional(),
  error: z.string().optional(),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  nextRetryAt: DateTimeSchema.optional(),
  deliveredAt: DateTimeSchema.optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
});

export const WebhookDeliveryListQuerySchema = z.object({
  webhookId: IdSchema.optional(),
  status: z.enum(['pending', 'delivered', 'failed', 'retrying']).optional(),
  event: WebhookEventSchema.optional(),
  createdAfter: DateTimeSchema.optional(),
  createdBefore: DateTimeSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const WebhookRetryRequestSchema = z.object({
  deliveryId: IdSchema,
  delay: z.number().optional(),
});

export const WebhookRetryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  retryAt: DateTimeSchema.optional(),
});

export const WebhookStatsSchema = z.object({
  total: z.number(),
  bySource: z.array(z.object({
    source: WebhookSourceSchema,
    count: z.number(),
  })),
  byEvent: z.array(z.object({
    event: WebhookEventSchema,
    count: z.number(),
  })),
  byStatus: z.array(z.object({
    status: z.enum(['pending', 'delivered', 'failed', 'retrying']),
    count: z.number(),
  })),
  successRate: z.number().optional(),
  failureRate: z.number().optional(),
  avgResponseTime: z.number().optional(),
  timeRange: z.object({
    start: DateTimeSchema,
    end: DateTimeSchema,
  }),
});

export const WebhookEventPayloadSchema = z.object({
  id: IdSchema,
  source: WebhookSourceSchema,
  event: WebhookEventSchema,
  data: JsonSchema,
  metadata: JsonSchema.optional(),
  timestamp: DateTimeSchema,
  signature: WebhookSignatureSchema,
});

export type WebhookSource = z.infer<typeof WebhookSourceSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type Webhook = z.infer<typeof WebhookSchema>;
export type CreateWebhookRequest = z.infer<typeof CreateWebhookRequestSchema>;
export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookRequestSchema>;
export type WebhookListQuery = z.infer<typeof WebhookListQuerySchema>;
export type WebhookTestRequest = z.infer<typeof WebhookTestRequestSchema>;
export type WebhookTestResponse = z.infer<typeof WebhookTestResponseSchema>;
export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;
export type WebhookDeliveryListQuery = z.infer<typeof WebhookDeliveryListQuerySchema>;
export type WebhookRetryRequest = z.infer<typeof WebhookRetryRequestSchema>;
export type WebhookRetryResponse = z.infer<typeof WebhookRetryResponseSchema>;
export type WebhookStats = z.infer<typeof WebhookStatsSchema>;
export type WebhookEventPayload = z.infer<typeof WebhookEventPayloadSchema>;