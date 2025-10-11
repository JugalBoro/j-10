'use client';

import React from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { api } from './client';
import { toast } from 'react-hot-toast';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry up to 2 times on network or 5xx errors
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        const message = error?.message || 'An error occurred';
        toast.error(message);
      },
    },
  },
});

// Query keys factory
export const queryKeys = {
  runs: {
    all: ['runs'] as const,
    lists: () => [...queryKeys.runs.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.runs.lists(), params] as const,
    details: () => [...queryKeys.runs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.runs.details(), id] as const,
    stats: () => [...queryKeys.runs.all, 'stats'] as const,
  },
  workflows: {
    all: ['workflows'] as const,
    lists: () => [...queryKeys.workflows.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.workflows.lists(), params] as const,
    details: () => [...queryKeys.workflows.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workflows.details(), id] as const,
  },
  connectors: {
    all: ['connectors'] as const,
    lists: () => [...queryKeys.connectors.all, 'list'] as const,
    list: () => [...queryKeys.connectors.lists()] as const,
    details: () => [...queryKeys.connectors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.connectors.details(), id] as const,
  },
  approvals: {
    all: ['approvals'] as const,
    lists: () => [...queryKeys.approvals.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.approvals.lists(), params] as const,
    details: () => [...queryKeys.approvals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.approvals.details(), id] as const,
  },
  rules: {
    all: ['rules'] as const,
    lists: () => [...queryKeys.rules.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.rules.lists(), params] as const,
    details: () => [...queryKeys.rules.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.rules.details(), id] as const,
  },
  dlq: {
    all: ['dlq'] as const,
    lists: () => [...queryKeys.dlq.all, 'list'] as const,
    list: () => [...queryKeys.dlq.lists()] as const,
  },
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  health: {
    all: ['health'] as const,
    check: () => [...queryKeys.health.all, 'check'] as const,
  },
};

// Hooks for runs
export function useRuns(params?: { status?: string; workflowId?: string; from?: string; to?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.runs.list(params),
    queryFn: () => api.runs.list(params),
    enabled: true,
  });
}

export function useRun(id: string) {
  return useQuery({
    queryKey: queryKeys.runs.detail(id),
    queryFn: () => api.runs.get(id),
    enabled: !!id,
  });
}

export function useRunsStats() {
  return useQuery({
    queryKey: queryKeys.runs.stats(),
    queryFn: () => api.runs.stats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hooks for workflows
export function useWorkflows(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.workflows.list(params),
    queryFn: () => api.workflows.list(params),
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: queryKeys.workflows.detail(id),
    queryFn: () => api.workflows.get(id),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.workflows.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
      toast.success('Workflow created successfully');
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.workflows.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(id) });
      toast.success('Workflow updated successfully');
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.workflows.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all });
      toast.success('Workflow deleted successfully');
    },
  });
}

// Hooks for connectors
export function useConnectors() {
  return useQuery({
    queryKey: queryKeys.connectors.list(),
    queryFn: () => api.connectors.list(),
  });
}

export function useConnector(id: string) {
  return useQuery({
    queryKey: queryKeys.connectors.detail(id),
    queryFn: () => api.connectors.get(id),
    enabled: !!id,
  });
}

// Hooks for approvals
export function useApprovals(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.approvals.list(params),
    queryFn: () => api.approvals.list(params),
  });
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: queryKeys.approvals.detail(id),
    queryFn: () => api.approvals.get(id),
    enabled: !!id,
  });
}

export function useActOnApproval() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) => 
      api.approvals.act(id, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.runs.all });
      toast.success('Approval action completed');
    },
  });
}

// Hooks for rules
export function useRules(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.rules.list(params),
    queryFn: () => api.rules.list(params),
  });
}

export function useRule(id: string) {
  return useQuery({
    queryKey: queryKeys.rules.detail(id),
    queryFn: () => api.rules.get(id),
    enabled: !!id,
  });
}

// Hooks for DLQ
export function useDlq() {
  return useQuery({
    queryKey: queryKeys.dlq.list(),
    queryFn: () => api.dlq.list(),
  });
}

export function useReplayDlqMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.dlq.replay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dlq.all });
      toast.success('Message replayed successfully');
    },
  });
}

export function useDeleteDlqMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.dlq.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dlq.all });
      toast.success('Message deleted successfully');
    },
  });
}

// Hooks for auth
export function useAuthMe() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => api.auth.me(),
    retry: false,
  });
}

// Hooks for health
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health.check(),
    queryFn: () => api.health.check(),
    refetchInterval: 60000, // Check every minute
  });
}

// Query provider component
export function ApiQueryProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children,
    React.createElement(ReactQueryDevtools, { initialIsOpen: false })
  );
}
