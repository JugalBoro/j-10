import { z } from 'zod';
import { IdSchema, DateTimeSchema, JsonSchema } from './common';

export const OrgPlanSchema = z.enum(['free', 'starter', 'professional', 'enterprise']);

export const OrgSettingsSchema = z.object({
  timezone: z.string().default('UTC'),
  dateFormat: z.string().default('YYYY-MM-DD'),
  currency: z.string().default('USD'),
  features: z.record(z.boolean()).default({}),
  retention: z.object({
    runs: z.number().default(90),
    artifacts: z.number().default(365),
    audit: z.number().default(2555),
  }).default({}),
  notifications: z.object({
    email: z.boolean().default(true),
    slack: z.boolean().default(false),
    webhook: z.boolean().default(false),
  }).default({}),
  security: z.object({
    requireMfa: z.boolean().default(false),
    sessionTimeout: z.number().default(3600),
    ipWhitelist: z.array(z.string()).default([]),
  }).default({}),
});

export const OrgSchema = z.object({
  id: IdSchema,
  name: z.string(),
  plan: OrgPlanSchema,
  settings: OrgSettingsSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  isActive: z.boolean().default(true),
  domain: z.string().optional(),
  logo: z.string().url().optional(),
  billingEmail: z.string().email().optional(),
});

export const CreateOrgRequestSchema = z.object({
  name: z.string().min(1),
  plan: OrgPlanSchema.default('free'),
  settings: OrgSettingsSchema.optional(),
  domain: z.string().optional(),
  billingEmail: z.string().email().optional(),
});

export const UpdateOrgRequestSchema = z.object({
  name: z.string().min(1).optional(),
  plan: OrgPlanSchema.optional(),
  settings: OrgSettingsSchema.optional(),
  domain: z.string().optional(),
  billingEmail: z.string().email().optional(),
  isActive: z.boolean().optional(),
  logo: z.string().url().optional(),
});

export const OrgStatsSchema = z.object({
  totalUsers: z.number(),
  totalWorkflows: z.number(),
  totalRuns: z.number(),
  totalConnectors: z.number(),
  activeRuns: z.number(),
  failedRuns: z.number(),
  lastRunAt: DateTimeSchema.optional(),
  storageUsed: z.number(), // bytes
  apiCallsThisMonth: z.number(),
  apiCallsLimit: z.number(),
});

export type OrgPlan = z.infer<typeof OrgPlanSchema>;
export type OrgSettings = z.infer<typeof OrgSettingsSchema>;
export type Org = z.infer<typeof OrgSchema>;
export type CreateOrgRequest = z.infer<typeof CreateOrgRequestSchema>;
export type UpdateOrgRequest = z.infer<typeof UpdateOrgRequestSchema>;
export type OrgStats = z.infer<typeof OrgStatsSchema>;