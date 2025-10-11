import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  DLQListQuerySchema,
  DLQReplayRequestSchema,
  DLQReplayResponseSchema,
  DLQQuarantineRequestSchema,
  DLQQuarantineResponseSchema,
  DLQArchiveRequestSchema,
  DLQArchiveResponseSchema,
  DLQExportRequestSchema,
  DLQExportResponseSchema,
  DLQStatsSchema,
  DLQRetryRequestSchema,
  DLQRetryResponseSchema,
  DLQDeleteRequestSchema,
  DLQDeleteResponseSchema,
} from '@schemas/automation';

@Injectable()
export class DlqService {
  constructor(private prisma: PrismaService) {}

  async getDLQMessages(query: DLQListQuerySchema) {
    const {
      queue,
      status,
      createdAfter,
      createdBefore,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (queue) {
      where.queue = queue;
    }

    if (status) {
      where.status = status;
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

    if (search) {
      where.OR = [
        { queue: { contains: search, mode: 'insensitive' } },
        { error: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [messages, total] = await Promise.all([
      this.prisma.dLQMessage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dLQMessage.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: messages.map((message) => ({
        id: message.id,
        queue: message.queue,
        payload: message.payload,
        error: message.error,
        firstSeenAt: message.firstSeenAt,
        lastTriedAt: message.lastTriedAt,
        tries: message.tries,
        maxTries: message.maxTries,
        status: message.status,
        metadata: message.metadata,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        replayedAt: message.replayedAt,
        quarantinedAt: message.quarantinedAt,
        archivedAt: message.archivedAt,
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

  async getDLQMessage(id: string) {
    const message = await this.prisma.dLQMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('DLQ message not found');
    }

    return {
      id: message.id,
      queue: message.queue,
      payload: message.payload,
      error: message.error,
      firstSeenAt: message.firstSeenAt,
      lastTriedAt: message.lastTriedAt,
      tries: message.tries,
      maxTries: message.maxTries,
      status: message.status,
      metadata: message.metadata,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      replayedAt: message.replayedAt,
      quarantinedAt: message.quarantinedAt,
      archivedAt: message.archivedAt,
    };
  }

  async replayDLQMessages(replayDto: DLQReplayRequestSchema) {
    const { messageIds, delay, maxTries } = replayDto;

    const messages = await this.prisma.dLQMessage.findMany({
      where: {
        id: { in: messageIds },
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (messages.length === 0) {
      throw new BadRequestException('No valid messages found to replay');
    }

    const replayTime = delay ? new Date(Date.now() + delay) : new Date();

    // Update messages to be replayed
    await this.prisma.dLQMessage.updateMany({
      where: {
        id: { in: messageIds },
      },
      data: {
        status: 'PENDING',
        tries: 0,
        lastTriedAt: replayTime,
        ...(maxTries && { maxTries }),
      },
    });

    logger.info(`${messages.length} DLQ messages queued for replay`);

    return {
      success: true,
      message: `${messages.length} messages queued for replay`,
      replayedCount: messages.length,
      failedCount: messageIds.length - messages.length,
    };
  }

  async quarantineDLQMessages(quarantineDto: DLQQuarantineRequestSchema) {
    const { messageIds, reason } = quarantineDto;

    const messages = await this.prisma.dLQMessage.findMany({
      where: {
        id: { in: messageIds },
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (messages.length === 0) {
      throw new BadRequestException('No valid messages found to quarantine');
    }

    // Update messages to quarantined
    await this.prisma.dLQMessage.updateMany({
      where: {
        id: { in: messageIds },
      },
      data: {
        status: 'QUARANTINED',
        quarantinedAt: new Date(),
        metadata: {
          quarantineReason: reason,
          quarantinedAt: new Date().toISOString(),
        },
      },
    });

    logger.info(`${messages.length} DLQ messages quarantined`);

    return {
      success: true,
      message: `${messages.length} messages quarantined`,
      quarantinedCount: messages.length,
    };
  }

  async archiveDLQMessages(archiveDto: DLQArchiveRequestSchema) {
    const { messageIds, reason } = archiveDto;

    const messages = await this.prisma.dLQMessage.findMany({
      where: {
        id: { in: messageIds },
        status: { in: ['REPLAYED', 'QUARANTINED'] },
      },
    });

    if (messages.length === 0) {
      throw new BadRequestException('No valid messages found to archive');
    }

    // Update messages to archived
    await this.prisma.dLQMessage.updateMany({
      where: {
        id: { in: messageIds },
      },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
        metadata: {
          archiveReason: reason,
          archivedAt: new Date().toISOString(),
        },
      },
    });

    logger.info(`${messages.length} DLQ messages archived`);

    return {
      success: true,
      message: `${messages.length} messages archived`,
      archivedCount: messages.length,
    };
  }

  async exportDLQMessages(exportDto: DLQExportRequestSchema) {
    const { messageIds, queue, status, format, includePayload, includeError } = exportDto;

    const where: any = {};

    if (messageIds && messageIds.length > 0) {
      where.id = { in: messageIds };
    } else {
      if (queue) {
        where.queue = queue;
      }
      if (status) {
        where.status = status;
      }
    }

    const messages = await this.prisma.dLQMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // In a real implementation, you would:
    // 1. Generate the export file (JSON or CSV)
    // 2. Upload to S3
    // 3. Return a signed download URL

    const exportData = messages.map(message => ({
      id: message.id,
      queue: message.queue,
      status: message.status,
      createdAt: message.createdAt,
      ...(includePayload && { payload: message.payload }),
      ...(includeError && { error: message.error }),
    }));

    const downloadUrl = `https://exports.example.com/dlq-export-${Date.now()}.${format}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    logger.info(`DLQ export created with ${messages.length} messages`);

    return {
      downloadUrl,
      expiresAt,
      recordCount: messages.length,
      fileSize: JSON.stringify(exportData).length,
    };
  }

  async retryDLQMessage(id: string, retryDto: DLQRetryRequestSchema) {
    const { delay } = retryDto;

    const message = await this.prisma.dLQMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('DLQ message not found');
    }

    if (message.status !== 'PENDING') {
      throw new BadRequestException('Message is not in pending status');
    }

    const retryTime = delay ? new Date(Date.now() + delay) : new Date();

    await this.prisma.dLQMessage.update({
      where: { id },
      data: {
        status: 'PENDING',
        tries: 0,
        lastTriedAt: retryTime,
      },
    });

    logger.info(`DLQ message ${id} queued for retry`);

    return {
      success: true,
      message: 'Message queued for retry',
      retryAt: retryTime,
    };
  }

  async deleteDLQMessages(deleteDto: DLQDeleteRequestSchema) {
    const { messageIds, reason } = deleteDto;

    const messages = await this.prisma.dLQMessage.findMany({
      where: {
        id: { in: messageIds },
      },
    });

    if (messages.length === 0) {
      throw new BadRequestException('No messages found to delete');
    }

    await this.prisma.dLQMessage.deleteMany({
      where: {
        id: { in: messageIds },
      },
    });

    logger.info(`${messages.length} DLQ messages deleted`);

    return {
      success: true,
      message: `${messages.length} messages deleted`,
      deletedCount: messages.length,
    };
  }

  async getDLQStats(query: any) {
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

    const [total, byStatus, byQueue, avgTries, oldestMessage, newestMessage] = await Promise.all([
      this.prisma.dLQMessage.count({ where }),
      this.prisma.dLQMessage.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.dLQMessage.groupBy({
        by: ['queue'],
        where,
        _count: { queue: true },
      }),
      this.prisma.dLQMessage.aggregate({
        where,
        _avg: { tries: true },
      }),
      this.prisma.dLQMessage.findFirst({
        where,
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.dLQMessage.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      byQueue: byQueue.map(item => ({
        queue: item.queue,
        count: item._count.queue,
      })),
      avgTries: avgTries._avg.tries,
      oldestMessage: oldestMessage?.createdAt,
      newestMessage: newestMessage?.createdAt,
      timeRange: {
        start: createdAfter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: createdBefore || new Date().toISOString(),
      },
    };
  }
}