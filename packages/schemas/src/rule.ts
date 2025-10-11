import { z } from 'zod';
import { IdSchema, DateTimeSchema, JsonSchema } from './common';

export const JsonLogicSchema = z.object({
  and: z.array(z.lazy(() => JsonLogicSchema)).optional(),
  or: z.array(z.lazy(() => JsonLogicSchema)).optional(),
  not: z.lazy(() => JsonLogicSchema).optional(),
  if: z.tuple([z.lazy(() => JsonLogicSchema), z.any(), z.any()]).optional(),
  '==': z.tuple([z.any(), z.any()]).optional(),
  '!=': z.tuple([z.any(), z.any()]).optional(),
  '>': z.tuple([z.any(), z.any()]).optional(),
  '>=': z.tuple([z.any(), z.any()]).optional(),
  '<': z.tuple([z.any(), z.any()]).optional(),
  '<=': z.tuple([z.any(), z.any()]).optional(),
  in: z.tuple([z.any(), z.array(z.any())]).optional(),
  '!in': z.tuple([z.any(), z.array(z.any())]).optional(),
  contains: z.tuple([z.any(), z.any()]).optional(),
  '!contains': z.tuple([z.any(), z.any()]).optional(),
  startsWith: z.tuple([z.any(), z.any()]).optional(),
  endsWith: z.tuple([z.any(), z.any()]).optional(),
  matches: z.tuple([z.any(), z.any()]).optional(),
  '!matches': z.tuple([z.any(), z.any()]).optional(),
  var: z.string().optional(),
  missing: z.string().optional(),
  missing_some: z.tuple([z.number(), z.array(z.string())]).optional(),
  '+': z.array(z.any()).optional(),
  '-': z.array(z.any()).optional(),
  '*': z.array(z.any()).optional(),
  '/': z.array(z.any()).optional(),
  '%': z.array(z.any()).optional(),
  min: z.array(z.any()).optional(),
  max: z.array(z.any()).optional(),
  merge: z.array(z.any()).optional(),
  cat: z.array(z.any()).optional(),
  substr: z.array(z.any()).optional(),
  log: z.any().optional(),
});

export const RuleSchema = z.object({
  id: IdSchema,
  orgId: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  jsonLogic: JsonLogicSchema,
  enabled: z.boolean().default(true),
  priority: z.number().int().min(1).max(100).default(50),
  tags: z.array(z.string()).default([]),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  createdBy: IdSchema,
  lastUsedAt: DateTimeSchema.optional(),
  usageCount: z.number().default(0),
});

export const CreateRuleRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  jsonLogic: JsonLogicSchema,
  enabled: z.boolean().default(true),
  priority: z.number().int().min(1).max(100).default(50),
  tags: z.array(z.string()).default([]),
});

export const UpdateRuleRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  jsonLogic: JsonLogicSchema.optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().min(1).max(100).optional(),
  tags: z.array(z.string()).optional(),
});

export const RuleListQuerySchema = z.object({
  orgId: IdSchema.optional(),
  enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  createdBy: IdSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const RuleTestRequestSchema = z.object({
  jsonLogic: JsonLogicSchema,
  data: JsonSchema,
});

export const RuleTestResponseSchema = z.object({
  result: z.boolean(),
  executionTime: z.number(),
  error: z.string().optional(),
  debug: z.object({
    steps: z.array(z.object({
      step: z.string(),
      result: z.any(),
      duration: z.number(),
    })),
    variables: JsonSchema,
  }).optional(),
});

export const RuleEvaluateRequestSchema = z.object({
  ruleId: IdSchema,
  data: JsonSchema,
  context: JsonSchema.optional(),
});

export const RuleEvaluateResponseSchema = z.object({
  result: z.boolean(),
  executionTime: z.number(),
  error: z.string().optional(),
  debug: z.object({
    steps: z.array(z.object({
      step: z.string(),
      result: z.any(),
      duration: z.number(),
    })),
    variables: JsonSchema,
  }).optional(),
});

export const RuleStatsSchema = z.object({
  total: z.number(),
  enabled: z.number(),
  disabled: z.number(),
  byPriority: z.array(z.object({
    priority: z.number(),
    count: z.number(),
  })),
  mostUsed: z.array(z.object({
    ruleId: IdSchema,
    ruleName: z.string(),
    usageCount: z.number(),
  })),
  avgExecutionTime: z.number().optional(),
  errorRate: z.number().optional(),
});

export type JsonLogic = z.infer<typeof JsonLogicSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type CreateRuleRequest = z.infer<typeof CreateRuleRequestSchema>;
export type UpdateRuleRequest = z.infer<typeof UpdateRuleRequestSchema>;
export type RuleListQuery = z.infer<typeof RuleListQuerySchema>;
export type RuleTestRequest = z.infer<typeof RuleTestRequestSchema>;
export type RuleTestResponse = z.infer<typeof RuleTestResponseSchema>;
export type RuleEvaluateRequest = z.infer<typeof RuleEvaluateRequestSchema>;
export type RuleEvaluateResponse = z.infer<typeof RuleEvaluateResponseSchema>;
export type RuleStats = z.infer<typeof RuleStatsSchema>;