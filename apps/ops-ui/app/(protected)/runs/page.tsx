'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRuns } from '@/lib/api/query';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Play,
  Eye,
  RefreshCw
} from 'lucide-react';

export default function RunsPage() {
  const { data: runs, isLoading, error } = useRuns({ limit: 20 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load runs
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || 'An error occurred while loading runs'}
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'RUNNING':
        return <Play className="h-5 w-5 text-blue-500" />;
      case 'QUEUED':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'NEEDS_APPROVAL':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'default' as const;
      case 'FAILED':
        return 'destructive' as const;
      case 'RUNNING':
        return 'secondary' as const;
      case 'QUEUED':
        return 'outline' as const;
      case 'NEEDS_APPROVAL':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Runs</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage workflow executions
          </p>
        </div>
        <Button>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
          <CardDescription>
            Latest workflow executions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {runs?.data?.data && runs.data.data.length > 0 ? (
            <div className="space-y-4">
              {runs.data.data.map((run: any) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(run.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {run.workflow?.name || 'Unknown Workflow'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {run.createdAt ? new Date(run.createdAt).toLocaleString() : 'Unknown time'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={getStatusBadgeVariant(run.status)}>
                      {run.status}
                    </Badge>
                    {run.duration && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(run.duration / 1000)}s
                      </span>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No runs found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
