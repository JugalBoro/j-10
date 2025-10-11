import { z } from 'zod';

export const IdSchema = z.string().min(1);
export const EmailSchema = z.string().email();
export const UrlSchema = z.string().url();
export const DateTimeSchema = z.string().datetime();
export const JsonSchema = z.record(z.unknown());

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
  });

export const IdempotencyKeySchema = z.string().min(1).max(255);

export const WebhookSignatureSchema = z.object({
  signature: z.string(),
  timestamp: z.string(),
});

export const RateLimitSchema = z.object({
  limit: z.number(),
  remaining: z.number(),
  reset: z.number(),
});

export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: z.string().datetime(),
  services: z.record(z.object({
    status: z.enum(['healthy', 'unhealthy', 'degraded']),
    latency: z.number().optional(),
    error: z.string().optional(),
  })),
});

export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse<T> = {
  success: boolean;
  data: T;
};
export type IdempotencyKey = z.infer<typeof IdempotencyKeySchema>;
export type WebhookSignature = z.infer<typeof WebhookSignatureSchema>;
export type RateLimit = z.infer<typeof RateLimitSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;