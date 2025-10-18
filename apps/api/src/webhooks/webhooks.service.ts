import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookListQuery,
  WebhookTestRequest,
  WebhookTestResponseSchema,
  WebhookDeliveryListQuery,
  WebhookRetryRequest,
  WebhookRetryResponseSchema,
  WebhookStatsSchema,
} from '@schemas/automation';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async getWebhooks(query: WebhookListQuery) {
    const {
      orgId,
      source,
      event,
      enabled,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (source) {
      where.source = source;
    }

    if (event) {
      where.event = event;
    }

    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    if (search) {
      where.OR = [
        { url: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [webhooks, total] = await Promise.all([
      this.prisma.webhook.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhook.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: webhooks.map((webhook) => ({
        id: webhook.id,
        orgId: webhook.orgId,
        source: webhook.source,
        event: webhook.event,
        url: webhook.url,
        secret: webhook.secret,
        enabled: webhook.enabled,
        metadata: webhook.metadata,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
        createdBy: webhook.createdBy,
        lastTriggeredAt: webhook.lastTriggeredAt,
        triggerCount: webhook.triggerCount,
        successCount: webhook.successCount,
        failureCount: webhook.failureCount,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getWebhook(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return {
      id: webhook.id,
      orgId: webhook.orgId,
      source: webhook.source,
      event: webhook.event,
      url: webhook.url,
      secret: webhook.secret,
      enabled: webhook.enabled,
      metadata: webhook.metadata,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      createdBy: webhook.createdBy,
      lastTriggeredAt: webhook.lastTriggeredAt,
      triggerCount: webhook.triggerCount,
      successCount: webhook.successCount,
      failureCount: webhook.failureCount,
    };
  }

  async createWebhook(createWebhookDto: CreateWebhookRequest) {
    const { source, event, url, secret, enabled, metadata } = createWebhookDto;

    // Validate webhook URL
    if (!this.isValidUrl(url)) {
      throw new BadRequestException('Invalid webhook URL');
    }

    // Generate secret if not provided
    const webhookSecret = secret || this.generateSecret();

    const webhook = await this.prisma.webhook.create({
      data: {
        source,
        event,
        url,
        secret: webhookSecret,
        enabled: enabled || true,
        metadata: metadata || {},
        orgId: 'demo-org-1', // In real implementation, get from user context
        createdBy: 'admin-user-1', // In real implementation, get from user context
      },
    });

    logger.info(`Webhook created for ${source}:${event}`);

    return {
      id: webhook.id,
      orgId: webhook.orgId,
      source: webhook.source,
      event: webhook.event,
      url: webhook.url,
      secret: webhook.secret,
      enabled: webhook.enabled,
      metadata: webhook.metadata,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      createdBy: webhook.createdBy,
      lastTriggeredAt: webhook.lastTriggeredAt,
      triggerCount: webhook.triggerCount,
      successCount: webhook.successCount,
      failureCount: webhook.failureCount,
    };
  }

  async updateWebhook(id: string, updateWebhookDto: UpdateWebhookRequest) {
    const { url, secret, enabled, metadata } = updateWebhookDto;

    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    // Validate webhook URL if provided
    if (url && !this.isValidUrl(url)) {
      throw new BadRequestException('Invalid webhook URL');
    }

    const updatedWebhook = await this.prisma.webhook.update({
      where: { id },
      data: {
        ...(url && { url }),
        ...(secret && { secret }),
        ...(enabled !== undefined && { enabled }),
        ...(metadata && { metadata }),
      },
    });

    logger.info(`Webhook ${id} updated`);

    return {
      id: updatedWebhook.id,
      orgId: updatedWebhook.orgId,
      source: updatedWebhook.source,
      event: updatedWebhook.event,
      url: updatedWebhook.url,
      secret: updatedWebhook.secret,
      enabled: updatedWebhook.enabled,
      metadata: updatedWebhook.metadata,
      createdAt: updatedWebhook.createdAt,
      updatedAt: updatedWebhook.updatedAt,
      createdBy: updatedWebhook.createdBy,
      lastTriggeredAt: updatedWebhook.lastTriggeredAt,
      triggerCount: updatedWebhook.triggerCount,
      successCount: updatedWebhook.successCount,
      failureCount: updatedWebhook.failureCount,
    };
  }

  async deleteWebhook(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.webhook.delete({
      where: { id },
    });

    logger.info(`Webhook ${id} deleted`);

    return { message: 'Webhook deleted successfully' };
  }

  async testWebhook(testDto: WebhookTestRequest) {
    const { webhookId, payload } = testDto;

    const webhook = await this.prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    if (!webhook.enabled) {
      throw new BadRequestException('Webhook is disabled');
    }

    const startTime = Date.now();

    try {
      // In a real implementation, you would:
      // 1. Send the webhook request
      // 2. Capture the response
      // 3. Return detailed results

      // Simulate webhook delivery
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-webhook-id': webhookId,
        },
        body: JSON.stringify({ success: true, message: 'Webhook delivered successfully' }),
      };

      return {
        success: true,
        message: 'Webhook test successful',
        response,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Webhook test failed',
        error: error.message,
      };
    }
  }

  async getWebhookDeliveries(query: WebhookDeliveryListQuery) {
    // In a real implementation, you would fetch from a webhook deliveries table
    // This is a mock implementation
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  async retryWebhookDelivery(id: string, retryDto: WebhookRetryRequest) {
    const { delay } = retryDto;

    // In a real implementation, you would:
    // 1. Find the webhook delivery
    // 2. Queue it for retry
    // 3. Update the retry count

    logger.info(`Webhook delivery ${id} queued for retry`);

    return {
      success: true,
      message: 'Webhook delivery queued for retry',
      retryAt: new Date(Date.now() + (delay || 0)),
    };
  }

  async getWebhookStats(query: any) {
    const { orgId, createdAfter, createdBefore } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (createdAfter) {
      where.createdAt = {
        gte: new Date(createdAfter),
      };
    }

    if (createdBefore) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(createdBefore),
      };
    }

    const [total, bySource, byEvent, byStatus, successRate, failureRate, avgResponseTime] = await Promise.all([
      this.prisma.webhook.count({ where }),
      this.prisma.webhook.groupBy({
        by: ['source'],
        where,
        _count: { source: true },
      }),
      this.prisma.webhook.groupBy({
        by: ['event'],
        where,
        _count: { event: true },
      }),
      // In a real implementation, you would group by delivery status
      [],
      this.prisma.webhook.aggregate({
        where,
        _avg: { successCount: true },
      }),
      this.prisma.webhook.aggregate({
        where,
        _avg: { failureCount: true },
      }),
      // In a real implementation, you would calculate from delivery logs
      1000, // Mock value
    ]);

    const totalTriggers = total;
    const totalSuccess = successRate._avg.successCount || 0;
    const totalFailure = failureRate._avg.failureCount || 0;

    return {
      total,
      bySource: bySource.map(item => ({
        source: item.source,
        count: item._count.source,
      })),
      byEvent: byEvent.map(item => ({
        event: item.event,
        count: item._count.event,
      })),
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: item.count,
      })),
      successRate: totalTriggers > 0 ? (totalSuccess / totalTriggers) * 100 : 0,
      failureRate: totalTriggers > 0 ? (totalFailure / totalTriggers) * 100 : 0,
      avgResponseTime,
      timeRange: {
        start: createdAfter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: createdBefore || new Date().toISOString(),
      },
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private generateSecret(): string {
    // In a real implementation, you would generate a secure random string
    return `whsec_${Math.random().toString(36).substring(2, 15)}`;
  }
}