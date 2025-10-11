'use client';

// Simple fetch wrapper for API calls
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

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

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const correlationId = this.generateCorrelationId();
    const url = `${this.baseUrl}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: requestHeaders,
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new ApiError(response.status, errorData.code, errorData.message, errorData.details);
      }

      const data = await response.json();
      return {
        data,
        correlationId: response.headers.get('x-correlation-id') || correlationId,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'NETWORK_ERROR', error instanceof Error ? error.message : 'Network error');
    }
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

  async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create client instance
export const apiClient = new ApiClient(apiBaseUrl);

// Typed API endpoints
export interface RunsResponse {
  data: Array<{
    id: string;
    status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'NEEDS_APPROVAL';
    workflowId: string;
    workflow?: {
      name: string;
    };
    createdAt: string;
    duration?: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RunsStatsResponse {
  total: number;
  successRate: number;
  byStatus: Record<string, number>;
}

export interface WorkflowsResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    createdAt: string;
    updatedAt?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ConnectorsResponse {
  data: Array<{
    id: string;
    name: string;
    type: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    createdAt: string;
  }>;
}

export interface ApprovalsResponse {
  data: Array<{
    id: string;
    runId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedBy: string;
    requestedAt: string;
    approvedBy?: string;
    approvedAt?: string;
    reason?: string;
  }>;
}

export interface RulesResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    priority: number;
    createdAt: string;
  }>;
}

export interface DlqResponse {
  data: Array<{
    id: string;
    messageId: string;
    queue: string;
    error: string;
    retryCount: number;
    createdAt: string;
  }>;
}

export interface AuthMeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string;
}

// API methods
export const api = {
  // Runs
  runs: {
    list: (params?: {
      status?: string;
      workflowId?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    }) => apiClient.get<RunsResponse>('/api/v1/runs', { headers: params as any }),
    
    get: (id: string) => apiClient.get(`/api/v1/runs/${id}`),
    
    stats: () => apiClient.get<RunsStatsResponse>('/api/v1/runs/stats'),
  },

  // Workflows
  workflows: {
    list: (params?: { page?: number; limit?: number }) => 
      apiClient.get<WorkflowsResponse>('/api/v1/workflows', { headers: params as any }),
    
    get: (id: string) => apiClient.get(`/api/v1/workflows/${id}`),
    
    create: (data: { name: string; description?: string }) => 
      apiClient.post('/api/v1/workflows', data),
    
    update: (id: string, data: { name?: string; description?: string; enabled?: boolean }) => 
      apiClient.put(`/api/v1/workflows/${id}`, data),
    
    delete: (id: string) => apiClient.delete(`/api/v1/workflows/${id}`),
  },

  // Connectors
  connectors: {
    list: () => apiClient.get<ConnectorsResponse>('/api/v1/connectors'),
    
    get: (id: string) => apiClient.get(`/api/v1/connectors/${id}`),
  },

  // Approvals
  approvals: {
    list: (params?: { status?: string; page?: number; limit?: number }) => 
      apiClient.get<ApprovalsResponse>('/api/v1/approvals', { headers: params as any }),
    
    get: (id: string) => apiClient.get(`/api/v1/approvals/${id}`),
    
    act: (id: string, action: 'approve' | 'reject', reason?: string) => 
      apiClient.post(`/api/v1/approvals/${id}/act`, { action, reason }),
  },

  // Rules
  rules: {
    list: (params?: { page?: number; limit?: number }) => 
      apiClient.get<RulesResponse>('/api/v1/rules', { headers: params as any }),
    
    get: (id: string) => apiClient.get(`/api/v1/rules/${id}`),
  },

  // DLQ
  dlq: {
    list: () => apiClient.get<DlqResponse>('/api/v1/dlq'),
    
    replay: (id: string) => apiClient.post(`/api/v1/dlq/${id}/replay`),
    
    delete: (id: string) => apiClient.delete(`/api/v1/dlq/${id}`),
  },

  // Auth
  auth: {
    me: () => apiClient.get<AuthMeResponse>('/api/v1/auth/me'),
  },

  // Health
  health: {
    check: () => apiClient.get('/api/v1/health'),
  },
};
