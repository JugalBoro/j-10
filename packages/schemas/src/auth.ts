import { z } from 'zod';
import { EmailSchema, IdSchema } from './common';

export const AuthProviderSchema = z.enum(['google', 'microsoft', 'local']);

export const UserRoleSchema = z.enum([
  'admin',
  'manager',
  'operator',
  'viewer',
  'approver',
]);

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8).optional(),
  provider: AuthProviderSchema.optional(),
  code: z.string().optional(), // OAuth code
  state: z.string().optional(), // OAuth state
});

export const LoginResponseSchema = z.object({
  user: z.object({
    id: IdSchema,
    email: EmailSchema,
    name: z.string(),
    role: UserRoleSchema,
    orgId: IdSchema,
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
});

export const LogoutRequestSchema = z.object({
  refreshToken: z.string().optional(),
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export const ResetPasswordRequestSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordConfirmSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export const VerifyEmailRequestSchema = z.object({
  token: z.string(),
});

export const AuthCallbackSchema = z.object({
  provider: AuthProviderSchema,
  code: z.string(),
  state: z.string().optional(),
});

export type AuthProvider = z.infer<typeof AuthProviderSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordConfirm = z.infer<typeof ResetPasswordConfirmSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;
export type AuthCallback = z.infer<typeof AuthCallbackSchema>;