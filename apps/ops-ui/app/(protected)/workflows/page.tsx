'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflows } from '@/lib/api/query';
import { 
  Workflow, 
  Plus,
  Play,
  Pause,
  Settings,
  Eye
} from 'lucide-react';

export default function WorkflowsPage() {
  const { data: workflows, isLoading, error } = useWorkflows({ limit: 20 });

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
          <Workflow className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load workflows
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error.message || 'An error occurred while loading workflows'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workflows</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage automation workflows
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Library</CardTitle>
          <CardDescription>
            Manage your automation workflows and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows?.data?.data && workflows.data.data.length > 0 ? (
            <div className="space-y-4">
              {workflows.data.data.map((workflow: any) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Workflow className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {workflow.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {workflow.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                      {workflow.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        {workflow.enabled ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workflows found</p>
              <p className="text-sm mt-2">Create your first workflow to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
