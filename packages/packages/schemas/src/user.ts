import { z } from 'zod';
import { IdSchema, EmailSchema, DateTimeSchema } from './common';
import { UserRoleSchema } from './auth';

export const UserSchema = z.object({
  id: IdSchema,
  email: EmailSchema,
  name: z.string(),
  role: UserRoleSchema,
  orgId: IdSchema,
  providerId: z.string().optional(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema.optional(),
  lastLoginAt: DateTimeSchema.optional(),
  isActive: z.boolean().default(true),
  avatar: z.string().url().optional(),
});

export const CreateUserRequestSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1),
  role: UserRoleSchema,
  orgId: IdSchema,
  providerId: z.string().optional(),
});

export const UpdateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().url().optional(),
});

export const UserListQuerySchema = z.object({
  orgId: IdSchema.optional(),
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const UserInviteRequestSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1),
  role: UserRoleSchema,
  message: z.string().optional(),
});

export const UserInviteResponseSchema = z.object({
  inviteId: IdSchema,
  inviteUrl: z.string().url(),
  expiresAt: DateTimeSchema,
});

export const AcceptInviteRequestSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type UserListQuery = z.infer<typeof UserListQuerySchema>;
export type UserInviteRequest = z.infer<typeof UserInviteRequestSchema>;
export type UserInviteResponse = z.infer<typeof UserInviteResponseSchema>;
export type AcceptInviteRequest = z.infer<typeof AcceptInviteRequestSchema>;