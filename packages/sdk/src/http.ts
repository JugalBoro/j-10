export interface ApiError {
  status: number;
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  data: T;
  correlationId: string;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  retries?: number;
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private getToken?: () => string | null;
  private defaultRetries: number;
  private defaultTimeout: number;

  constructor(
    baseUrl: string,
    getToken?: () => string | null,
    options: { retries?: number; timeout?: number } = {}
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.getToken = getToken;
    this.defaultRetries = options.retries ?? 3;
    this.defaultTimeout = options.timeout ?? 10000;
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      retries = this.defaultRetries,
      timeout = this.defaultTimeout,
      headers = {},
      ...fetchOptions
    } = options;

    const correlationId = this.generateCorrelationId();
    const url = `${this.baseUrl}${endpoint}`;

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
      ...headers,
    };

    // Add authorization token if available
    if (this.getToken) {
      const token = this.getToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle 401 - Unauthorized
        if (response.status === 401) {
          // Trigger sign out if token getter is available
          if (this.getToken) {
            // This will be handled by the frontend auth system
            throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
          }
        }

        // Handle 409 - Conflict (don't retry)
        if (response.status === 409) {
          const errorData = await this.parseErrorResponse(response);
          throw new ApiError(409, 'CONFLICT', errorData.message, errorData.details);
        }

        // Handle 4xx errors (don't retry)
        if (response.status >= 400 && response.status < 500) {
          const errorData = await this.parseErrorResponse(response);
          throw new ApiError(response.status, errorData.code, errorData.message, errorData.details);
        }

        // Handle 5xx errors (retry)
        if (response.status >= 500) {
          const errorData = await this.parseErrorResponse(response);
          lastError = new ApiError(response.status, errorData.code, errorData.message, errorData.details);
          
          if (attempt < retries) {
            // Exponential backoff
            const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
            await this.delay(delayMs);
            continue;
          }
          throw lastError;
        }

        // Success
        const data = await response.json();
        return {
          data,
          correlationId: response.headers.get('x-correlation-id') || correlationId,
        };

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof ApiError && error.status < 500) {
          throw error;
        }

        // Network errors or 5xx errors
        if (attempt < retries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          await this.delay(delayMs);
          continue;
        }
        
        throw error;
      }
    }

    throw lastError || new Error('Request failed');
  }

  private async parseErrorResponse(response: Response): Promise<{ code?: string; message: string; details?: Record<string, unknown> }> {
    try {
      const errorData = await response.json();
      return {
        code: errorData.code || errorData.error?.code,
        message: errorData.message || errorData.error?.message || 'An error occurred',
        details: errorData.details || errorData.error?.details,
      };
    } catch {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  }

  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create a default client instance
export function createApiClient(baseUrl: string, getToken?: () => string | null) {
  return new ApiClient(baseUrl, getToken);
}
