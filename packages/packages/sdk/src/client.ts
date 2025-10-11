import { z } from 'zod';
import { retryWithBackoff } from '@common/automation';

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export class AutomationClient {
  private config: Required<ClientConfig>;

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      headers: {},
      ...config,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    options: { schema?: z.ZodSchema<T> } = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout),
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
    }

    const executeRequest = async () => {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      
      if (options.schema) {
        return options.schema.parse(result);
      }
      
      return result;
    };

    return retryWithBackoff(executeRequest, {
      maxRetries: this.config.retries,
      baseDelay: 1000,
      maxDelay: 10000,
      jitter: true,
    });
  }

  // Auth endpoints
  async login(data: unknown) {
    return this.request('POST', '/auth/login', data);
  }

  async refreshToken(data: unknown) {
    return this.request('POST', '/auth/refresh', data);
  }

  async logout(data: unknown) {
    return this.request('POST', '/auth/logout', data);
  }

  // User endpoints
  async getUsers(query?: unknown) {
    return this.request('GET', '/users', undefined, { query });
  }

  async getUser(id: string) {
    return this.request('GET', `/users/${id}`);
  }

  async createUser(data: unknown) {
    return this.request('POST', '/users', data);
  }

  async updateUser(id: string, data: unknown) {
    return this.request('PUT', `/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.request('DELETE', `/users/${id}`);
  }

  // Organization endpoints
  async getOrgs(query?: unknown) {
    return this.request('GET', '/orgs', undefined, { query });
  }

  async getOrg(id: string) {
    return this.request('GET', `/orgs/${id}`);
  }

  async createOrg(data: unknown) {
    return this.request('POST', '/orgs', data);
  }

  async updateOrg(id: string, data: unknown) {
    return this.request('PUT', `/orgs/${id}`, data);
  }

  async getOrgStats(id: string) {
    return this.request('GET', `/orgs/${id}/stats`);
  }

  // Connector endpoints
  async getConnectors(query?: unknown) {
    return this.request('GET', '/connectors', undefined, { query });
  }

  async getConnector(id: string) {
    return this.request('GET', `/connectors/${id}`);
  }

  async createConnector(data: unknown) {
    return this.request('POST', '/connectors', data);
  }

  async updateConnector(id: string, data: unknown) {
    return this.request('PUT', `/connectors/${id}`, data);
  }

  async deleteConnector(id: string) {
    return this.request('DELETE', `/connectors/${id}`);
  }

  async testConnector(data: unknown) {
    return this.request('POST', '/connectors/test', data);
  }

  async installConnector(data: unknown) {
    return this.request('POST', '/connectors/install', data);
  }

  async connectorCallback(data: unknown) {
    return this.request('POST', '/connectors/callback', data);
  }

  // Workflow endpoints
  async getWorkflows(query?: unknown) {
    return this.request('GET', '/workflows', undefined, { query });
  }

  async getWorkflow(id: string) {
    return this.request('GET', `/workflows/${id}`);
  }

  async createWorkflow(data: unknown) {
    return this.request('POST', '/workflows', data);
  }

  async updateWorkflow(id: string, data: unknown) {
    return this.request('PUT', `/workflows/${id}`, data);
  }

  async deleteWorkflow(id: string) {
    return this.request('DELETE', `/workflows/${id}`);
  }

  async runWorkflow(data: unknown) {
    return this.request('POST', '/workflows/run', data);
  }

  async testWorkflow(data: unknown) {
    return this.request('POST', '/workflows/test', data);
  }

  // Run endpoints
  async getRuns(query?: unknown) {
    return this.request('GET', '/runs', undefined, { query });
  }

  async getRun(id: string) {
    return this.request('GET', `/runs/${id}`);
  }

  async retryRun(id: string, data: unknown) {
    return this.request('POST', `/runs/${id}/retry`, data);
  }

  async cancelRun(id: string, data: unknown) {
    return this.request('POST', `/runs/${id}/cancel`, data);
  }

  async getRunLogs(id: string, query?: unknown) {
    return this.request('GET', `/runs/${id}/logs`, undefined, { query });
  }

  async getRunStats(query?: unknown) {
    return this.request('GET', '/runs/stats', undefined, { query });
  }

  // Rule endpoints
  async getRules(query?: unknown) {
    return this.request('GET', '/rules', undefined, { query });
  }

  async getRule(id: string) {
    return this.request('GET', `/rules/${id}`);
  }

  async createRule(data: unknown) {
    return this.request('POST', '/rules', data);
  }

  async updateRule(id: string, data: unknown) {
    return this.request('PUT', `/rules/${id}`, data);
  }

  async deleteRule(id: string) {
    return this.request('DELETE', `/rules/${id}`);
  }

  async testRule(data: unknown) {
    return this.request('POST', '/rules/test', data);
  }

  async evaluateRule(data: unknown) {
    return this.request('POST', '/rules/evaluate', data);
  }

  // Approval endpoints
  async getApprovals(query?: unknown) {
    return this.request('GET', '/approvals', undefined, { query });
  }

  async getApproval(id: string) {
    return this.request('GET', `/approvals/${id}`);
  }

  async createApproval(data: unknown) {
    return this.request('POST', '/approvals', data);
  }

  async updateApproval(id: string, data: unknown) {
    return this.request('PUT', `/approvals/${id}`, data);
  }

  async actionApproval(id: string, data: unknown) {
    return this.request('POST', `/approvals/${id}/action`, data);
  }

  async getApprovalStats(query?: unknown) {
    return this.request('GET', '/approvals/stats', undefined, { query });
  }

  // Schedule endpoints
  async getSchedules(query?: unknown) {
    return this.request('GET', '/schedules', undefined, { query });
  }

  async getSchedule(id: string) {
    return this.request('GET', `/schedules/${id}`);
  }

  async createSchedule(data: unknown) {
    return this.request('POST', '/schedules', data);
  }

  async updateSchedule(id: string, data: unknown) {
    return this.request('PUT', `/schedules/${id}`, data);
  }

  async deleteSchedule(id: string) {
    return this.request('DELETE', `/schedules/${id}`);
  }

  async testSchedule(data: unknown) {
    return this.request('POST', '/schedules/test', data);
  }

  // Evidence endpoints
  async getEvidence(query?: unknown) {
    return this.request('GET', '/evidence', undefined, { query });
  }

  async getEvidenceItem(id: string) {
    return this.request('GET', `/evidence/${id}`);
  }

  async createEvidence(data: unknown) {
    return this.request('POST', '/evidence', data);
  }

  async downloadEvidence(id: string, query?: unknown) {
    return this.request('GET', `/evidence/${id}/download`, undefined, { query });
  }

  async getEvidenceStats(query?: unknown) {
    return this.request('GET', '/evidence/stats', undefined, { query });
  }

  // DLQ endpoints
  async getDLQMessages(query?: unknown) {
    return this.request('GET', '/dlq', undefined, { query });
  }

  async getDLQMessage(id: string) {
    return this.request('GET', `/dlq/${id}`);
  }

  async replayDLQMessages(data: unknown) {
    return this.request('POST', '/dlq/replay', data);
  }

  async quarantineDLQMessages(data: unknown) {
    return this.request('POST', '/dlq/quarantine', data);
  }

  async archiveDLQMessages(data: unknown) {
    return this.request('POST', '/dlq/archive', data);
  }

  async exportDLQMessages(data: unknown) {
    return this.request('POST', '/dlq/export', data);
  }

  async getDLQStats(query?: unknown) {
    return this.request('GET', '/dlq/stats', undefined, { query });
  }

  // Webhook endpoints
  async getWebhooks(query?: unknown) {
    return this.request('GET', '/webhooks', undefined, { query });
  }

  async getWebhook(id: string) {
    return this.request('GET', `/webhooks/${id}`);
  }

  async createWebhook(data: unknown) {
    return this.request('POST', '/webhooks', data);
  }

  async updateWebhook(id: string, data: unknown) {
    return this.request('PUT', `/webhooks/${id}`, data);
  }

  async deleteWebhook(id: string) {
    return this.request('DELETE', `/webhooks/${id}`);
  }

  async testWebhook(data: unknown) {
    return this.request('POST', '/webhooks/test', data);
  }

  async getWebhookDeliveries(query?: unknown) {
    return this.request('GET', '/webhooks/deliveries', undefined, { query });
  }

  async getWebhookStats(query?: unknown) {
    return this.request('GET', '/webhooks/stats', undefined, { query });
  }

  // Health check
  async health() {
    return this.request('GET', '/health');
  }
}