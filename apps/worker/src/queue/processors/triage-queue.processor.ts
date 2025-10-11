import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { logger } from '@common/automation';
import { WorkflowService } from '../workflow/workflow.service';
import { ConnectorService } from '../connector/connector.service';
import { NotificationService } from '../notification/notification.service';

@Processor('triage-queue')
export class TriageQueueProcessor {
  constructor(
    private prisma: PrismaService,
    private workflowService: WorkflowService,
    private connectorService: ConnectorService,
    private notificationService: NotificationService,
  ) {}

  @Process('classify-ticket')
  async classifyTicket(job: Job<{
    runId: string;
    workflowId: string;
    input: any;
  }>) {
    const { runId, workflowId, input } = job.data;

    logger.info(`Classifying ticket for run ${runId}`);

    try {
      // Update run status
      await this.prisma.run.update({
        where: { id: runId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
        },
      });

      // Step 1: Classify Ticket
      const classifyStep = await this.createRunStep(runId, 'classify', 'Classify Ticket');
      const classification = await this.classifyTicket(input);
      await this.completeRunStep(classifyStep.id, classification);

      // Step 2: Assign to Queue
      const assignStep = await this.createRunStep(runId, 'assign', 'Assign to Queue');
      const assignment = await this.assignToQueue(classification);
      await this.completeRunStep(assignStep.id, assignment);

      // Step 3: Set SLA Timers
      const slaStep = await this.createRunStep(runId, 'sla', 'Set SLA Timers');
      const slaData = await this.setSLATimers(classification, assignment);
      await this.completeRunStep(slaStep.id, slaData);

      // Step 4: Send Notifications
      const notifyStep = await this.createRunStep(runId, 'notify', 'Send Notifications');
      await this.sendNotifications(classification, assignment);
      await this.completeRunStep(notifyStep.id, { sent: true });

      // Complete the run
      await this.prisma.run.update({
        where: { id: runId },
        data: {
          status: 'SUCCEEDED',
          finishedAt: new Date(),
          output: {
            ticketId: input.ticketId,
            category: classification.category,
            priority: classification.priority,
            queue: assignment.queue,
            sla: slaData,
          },
        },
      });

      logger.info(`Ticket classification completed for run ${runId}`);

    } catch (error) {
      logger.error(`Ticket classification failed for run ${runId}:`, error);
      
      await this.prisma.run.update({
        where: { id: runId },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          error: error.message,
        },
      });
    }
  }

  private async createRunStep(runId: string, stepId: string, name: string) {
    return this.prisma.runStep.create({
      data: {
        runId,
        name,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
  }

  private async completeRunStep(stepId: string, output: any) {
    return this.prisma.runStep.update({
      where: { id: stepId },
      data: {
        status: 'SUCCEEDED',
        finishedAt: new Date(),
        metrics: { output },
      },
    });
  }

  private async classifyTicket(input: any) {
    // In a real implementation, you would:
    // 1. Use LLM to classify the ticket
    // 2. Apply business rules
    // 3. Determine priority and category

    logger.info(`Classifying ticket ${input.ticketId}`);
    
    // Simulate classification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { subject, description } = input;
    
    // Simple rule-based classification
    let category = 'question';
    let priority = 'medium';
    let confidence = 0.8;

    if (subject.toLowerCase().includes('urgent') || description.toLowerCase().includes('down')) {
      category = 'incident';
      priority = 'high';
      confidence = 0.9;
    } else if (subject.toLowerCase().includes('bug') || description.toLowerCase().includes('error')) {
      category = 'bug';
      priority = 'medium';
      confidence = 0.85;
    } else if (subject.toLowerCase().includes('feature') || description.toLowerCase().includes('enhancement')) {
      category = 'feature';
      priority = 'low';
      confidence = 0.8;
    }

    return {
      category,
      priority,
      confidence,
      tags: this.extractTags(subject, description),
      sentiment: this.analyzeSentiment(description),
    };
  }

  private async assignToQueue(classification: any) {
    // In a real implementation, you would:
    // 1. Apply assignment rules
    // 2. Check team availability
    // 3. Consider workload balancing

    logger.info(`Assigning ticket to queue based on classification`);
    
    const queueMap = {
      'incident': 'incident-queue',
      'bug': 'engineering-queue',
      'feature': 'product-queue',
      'question': 'support-queue',
    };

    const queue = queueMap[classification.category] || 'general-queue';
    
    return {
      queue,
      team: this.getTeamForQueue(queue),
      estimatedResolution: this.getEstimatedResolution(classification.priority),
    };
  }

  private async setSLATimers(classification: any, assignment: any) {
    // In a real implementation, you would:
    // 1. Calculate SLA based on priority and category
    // 2. Consider business hours
    // 3. Set up escalation timers

    logger.info(`Setting SLA timers for ticket`);
    
    const slaHours = {
      'high': 4,    // 4 hours for high priority
      'medium': 24, // 24 hours for medium priority
      'low': 72,    // 72 hours for low priority
    };

    const firstResponseHours = slaHours[classification.priority] || 24;
    const resolutionHours = firstResponseHours * 3; // 3x for resolution

    return {
      firstResponseHours,
      resolutionHours,
      escalationLevels: ['team_lead', 'manager', 'director'],
      businessHours: '9:00-17:00',
    };
  }

  private async sendNotifications(classification: any, assignment: any) {
    // In a real implementation, you would:
    // 1. Send Slack notifications
    // 2. Send email alerts
    // 3. Update dashboards

    logger.info(`Sending notifications for ticket classification`);
    
    await this.notificationService.sendTicketNotification({
      team: assignment.team,
      category: classification.category,
      priority: classification.priority,
      queue: assignment.queue,
    });
  }

  private extractTags(subject: string, description: string): string[] {
    const tags: string[] = [];
    const text = `${subject} ${description}`.toLowerCase();
    
    if (text.includes('login')) tags.push('authentication');
    if (text.includes('payment')) tags.push('billing');
    if (text.includes('mobile')) tags.push('mobile');
    if (text.includes('api')) tags.push('api');
    if (text.includes('database')) tags.push('database');
    
    return tags;
  }

  private analyzeSentiment(description: string): string {
    // Simple sentiment analysis
    const positiveWords = ['great', 'excellent', 'good', 'thanks', 'helpful'];
    const negativeWords = ['terrible', 'awful', 'broken', 'frustrated', 'angry'];
    
    const text = description.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private getTeamForQueue(queue: string): string {
    const teamMap = {
      'incident-queue': 'Incident Response Team',
      'engineering-queue': 'Engineering Team',
      'product-queue': 'Product Team',
      'support-queue': 'Support Team',
      'general-queue': 'General Support',
    };
    
    return teamMap[queue] || 'General Support';
  }

  private getEstimatedResolution(priority: string): string {
    const resolutionMap = {
      'high': '2-4 hours',
      'medium': '1-2 days',
      'low': '3-5 days',
    };
    
    return resolutionMap[priority] || '1-2 days';
  }
}