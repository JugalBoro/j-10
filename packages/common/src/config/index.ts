import { cleanEnv, str, num, bool, url } from 'envalid';
import { z } from 'zod';

export const config = cleanEnv(process.env, {
  // Database
  DATABASE_URL: str(),
  
  // Redis
  REDIS_URL: str(),
  
  // MinIO/S3
  S3_ENDPOINT: url(),
  S3_ACCESS_KEY_ID: str(),
  S3_SECRET_ACCESS_KEY: str(),
  S3_BUCKET: str(),
  S3_REGION: str({ default: 'us-east-1' }),
  
  // JWT
  JWT_SECRET: str(),
  JWT_EXPIRES_IN: str({ default: '7d' }),
  
  // OAuth2/OIDC
  NEXTAUTH_URL: url(),
  NEXTAUTH_SECRET: str(),
  GOOGLE_CLIENT_ID: str({ default: '' }),
  GOOGLE_CLIENT_SECRET: str({ default: '' }),
  MICROSOFT_CLIENT_ID: str({ default: '' }),
  MICROSOFT_CLIENT_SECRET: str({ default: '' }),
  
  // Email
  SMTP_HOST: str({ default: 'localhost' }),
  SMTP_PORT: num({ default: 1025 }),
  SMTP_USER: str({ default: '' }),
  SMTP_PASS: str({ default: '' }),
  SMTP_FROM: str({ default: 'noreply@automation.local' }),
  
  // Connectors
  SLACK_CLIENT_ID: str({ default: '' }),
  SLACK_CLIENT_SECRET: str({ default: '' }),
  SLACK_SIGNING_SECRET: str({ default: '' }),
  
  GOOGLE_SERVICE_ACCOUNT_KEY: str({ default: '' }),
  GOOGLE_WORKSPACE_DOMAIN: str({ default: '' }),
  
  MICROSOFT_TENANT_ID: str({ default: '' }),
  
  SALESFORCE_CLIENT_ID: str({ default: '' }),
  SALESFORCE_CLIENT_SECRET: str({ default: '' }),
  SALESFORCE_SANDBOX: bool({ default: true }),
  
  HUBSPOT_CLIENT_ID: str({ default: '' }),
  HUBSPOT_CLIENT_SECRET: str({ default: '' }),
  
  JIRA_BASE_URL: str({ default: '' }),
  JIRA_CLIENT_ID: str({ default: '' }),
  JIRA_CLIENT_SECRET: str({ default: '' }),
  
  ZENDESK_SUBDOMAIN: str({ default: '' }),
  ZENDESK_CLIENT_ID: str({ default: '' }),
  ZENDESK_CLIENT_SECRET: str({ default: '' }),
  
  // Temporal
  ENABLE_TEMPORAL: bool({ default: false }),
  TEMPORAL_ADDRESS: str({ default: 'localhost:7233' }),
  
  // Observability
  OTEL_EXPORTER_OTLP_ENDPOINT: str({ default: '' }),
  PROMETHEUS_ENDPOINT: str({ default: '' }),
  
  // Feature Flags
  ENABLE_LLM_FALLBACK: bool({ default: true }),
  ENABLE_OCR_CLOUD: bool({ default: false }),
  ENABLE_SANDBOX_MODE: bool({ default: true }),
  
  // Security
  ENCRYPTION_KEY: str(),
  WEBHOOK_SECRET: str(),
  
  // Rate Limiting
  RATE_LIMIT_TTL: num({ default: 60 }),
  RATE_LIMIT_MAX: num({ default: 100 }),
  
  // Retention
  AUDIT_RETENTION_DAYS: num({ default: 2555 }),
  RUN_RETENTION_DAYS: num({ default: 90 }),
  ARTIFACT_RETENTION_DAYS: num({ default: 365 }),
});

export const configSchema = z.object({
  database: z.object({
    url: z.string().url(),
  }),
  redis: z.object({
    url: z.string().url(),
  }),
  s3: z.object({
    endpoint: z.string().url(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    bucket: z.string(),
    region: z.string(),
  }),
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.string(),
  }),
  oauth: z.object({
    nextAuthUrl: z.string().url(),
    nextAuthSecret: z.string(),
    google: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
    }),
    microsoft: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
    }),
  }),
  connectors: z.object({
    slack: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
      signingSecret: z.string(),
    }),
    google: z.object({
      serviceAccountKey: z.string(),
      workspaceDomain: z.string(),
    }),
    microsoft: z.object({
      tenantId: z.string(),
      clientId: z.string(),
      clientSecret: z.string(),
    }),
    salesforce: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
      sandbox: z.boolean(),
    }),
    hubspot: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
    }),
    jira: z.object({
      baseUrl: z.string().url(),
      clientId: z.string(),
      clientSecret: z.string(),
    }),
    zendesk: z.object({
      subdomain: z.string(),
      clientId: z.string(),
      clientSecret: z.string(),
    }),
  }),
  temporal: z.object({
    enabled: z.boolean(),
    address: z.string(),
  }),
  observability: z.object({
    otelEndpoint: z.string().optional(),
    prometheusEndpoint: z.string().optional(),
  }),
  features: z.object({
    llmFallback: z.boolean(),
    ocrCloud: z.boolean(),
    sandboxMode: z.boolean(),
  }),
  security: z.object({
    encryptionKey: z.string(),
    webhookSecret: z.string(),
  }),
  rateLimit: z.object({
    ttl: z.number(),
    max: z.number(),
  }),
  retention: z.object({
    auditDays: z.number(),
    runDays: z.number(),
    artifactDays: z.number(),
  }),
});

export type Config = z.infer<typeof configSchema>;