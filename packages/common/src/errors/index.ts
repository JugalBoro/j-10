export class AutomationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AutomationError';
  }
}

export class ValidationError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AutomationError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AutomationError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AutomationError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AutomationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AutomationError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

export class ConnectorError extends AutomationError {
  constructor(
    connector: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      `Connector ${connector}: ${message}`,
      'CONNECTOR_ERROR',
      502,
      { connector, ...details }
    );
    this.name = 'ConnectorError';
  }
}

export class WorkflowError extends AutomationError {
  constructor(
    workflowId: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      `Workflow ${workflowId}: ${message}`,
      'WORKFLOW_ERROR',
      500,
      { workflowId, ...details }
    );
    this.name = 'WorkflowError';
  }
}

export class IdempotencyError extends AutomationError {
  constructor(key: string, message: string = 'Idempotency key already used') {
    super(message, 'IDEMPOTENCY_ERROR', 409, { key });
    this.name = 'IdempotencyError';
  }
}

export class WebhookError extends AutomationError {
  constructor(
    source: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      `Webhook ${source}: ${message}`,
      'WEBHOOK_ERROR',
      400,
      { source, ...details }
    );
    this.name = 'WebhookError';
  }
}

export function isAutomationError(error: unknown): error is AutomationError {
  return error instanceof AutomationError;
}

export function getErrorResponse(error: unknown) {
  if (isAutomationError(error)) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      statusCode: error.statusCode,
    };
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    statusCode: 500,
  };
}