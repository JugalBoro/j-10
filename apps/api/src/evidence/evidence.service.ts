import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  CreateEvidenceRequestSchema,
  EvidenceListQuerySchema,
  EvidenceDownloadRequestSchema,
  EvidenceDownloadResponseSchema,
  EvidenceStatsSchema,
} from '@schemas/automation';

@Injectable()
export class EvidenceService {
  constructor(private prisma: PrismaService) {}

  async getEvidence(query: EvidenceListQuerySchema) {
    const {
      runId,
      stepId,
      type,
      tags,
      isPublic,
      createdAfter,
      createdBefore,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (runId) {
      where.runId = runId;
    }

    if (stepId) {
      where.stepId = stepId;
    }

    if (type) {
      where.type = type;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
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
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [evidence, total] = await Promise.all([
      this.prisma.evidence.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          run: {
            select: {
              id: true,
              workflowId: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.evidence.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: evidence.map((item) => ({
        id: item.id,
        runId: item.runId,
        stepId: item.stepId,
        type: item.type,
        name: item.name,
        description: item.description,
        s3Key: item.s3Key,
        s3Bucket: item.s3Bucket,
        s3Region: item.s3Region,
        url: item.url,
        size: item.size,
        hash: item.hash,
        mimeType: item.mimeType,
        metadata: item.metadata,
        createdAt: item.createdAt,
        createdBy: item.createdBy,
        tags: item.tags,
        isPublic: item.isPublic,
        expiresAt: item.expiresAt,
        run: item.run,
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

  async getEvidenceItem(id: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
      include: {
        run: {
          select: {
            id: true,
            workflowId: true,
            status: true,
          },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    return {
      id: evidence.id,
      runId: evidence.runId,
      stepId: evidence.stepId,
      type: evidence.type,
      name: evidence.name,
      description: evidence.description,
      s3Key: evidence.s3Key,
      s3Bucket: evidence.s3Bucket,
      s3Region: evidence.s3Region,
      url: evidence.url,
      size: evidence.size,
      hash: evidence.hash,
      mimeType: evidence.mimeType,
      metadata: evidence.metadata,
      createdAt: evidence.createdAt,
      createdBy: evidence.createdBy,
      tags: evidence.tags,
      isPublic: evidence.isPublic,
      expiresAt: evidence.expiresAt,
      run: evidence.run,
    };
  }

  async createEvidence(createEvidenceDto: CreateEvidenceRequestSchema) {
    const {
      runId,
      stepId,
      type,
      name,
      description,
      data,
      mimeType,
      metadata,
      tags,
      isPublic,
      expiresAt,
    } = createEvidenceDto;

    // Check if run exists
    const run = await this.prisma.run.findUnique({
      where: { id: runId },
    });

    if (!run) {
      throw new NotFoundException('Run not found');
    }

    // In a real implementation, you would:
    // 1. Upload the data to S3
    // 2. Generate a unique S3 key
    // 3. Calculate the file hash
    // 4. Store the metadata

    const s3Key = `evidence/${runId}/${stepId || 'general'}/${Date.now()}-${name}`;
    const s3Bucket = 'automation-artifacts';
    const s3Region = 'us-east-1';
    const url = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${s3Key}`;
    const size = Buffer.from(data, 'base64').length;
    const hash = this.calculateHash(data);

    const evidence = await this.prisma.evidence.create({
      data: {
        runId,
        stepId,
        type,
        name,
        description,
        s3Key,
        s3Bucket,
        s3Region,
        url,
        size,
        hash,
        mimeType: mimeType || this.getMimeTypeFromName(name),
        metadata: metadata || {},
        tags: tags || [],
        isPublic: isPublic || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: 'admin-user-1', // In real implementation, get from user context
      },
    });

    logger.info(`Evidence ${name} created for run ${runId}`);

    return {
      id: evidence.id,
      runId: evidence.runId,
      stepId: evidence.stepId,
      type: evidence.type,
      name: evidence.name,
      description: evidence.description,
      s3Key: evidence.s3Key,
      s3Bucket: evidence.s3Bucket,
      s3Region: evidence.s3Region,
      url: evidence.url,
      size: evidence.size,
      hash: evidence.hash,
      mimeType: evidence.mimeType,
      metadata: evidence.metadata,
      createdAt: evidence.createdAt,
      createdBy: evidence.createdBy,
      tags: evidence.tags,
      isPublic: evidence.isPublic,
      expiresAt: evidence.expiresAt,
    };
  }

  async downloadEvidence(id: string, query: EvidenceDownloadRequestSchema) {
    const { format = 'original' } = query;

    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    // In a real implementation, you would:
    // 1. Generate a signed URL for S3
    // 2. Handle different formats (original, thumbnail, preview)
    // 3. Set appropriate expiration time

    const downloadUrl = `${evidence.url}?format=${format}&expires=${Date.now() + 3600000}`; // 1 hour
    const expiresAt = new Date(Date.now() + 3600000);

    return {
      url: downloadUrl,
      expiresAt,
      size: evidence.size,
      mimeType: evidence.mimeType,
    };
  }

  async getEvidenceStats(query: any) {
    const { orgId, runId, createdAfter, createdBefore } = query;

    const where: any = {};

    if (orgId) {
      where.run = {
        orgId,
      };
    }

    if (runId) {
      where.runId = runId;
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

    const [total, totalSize, byType, byRun, avgSize] = await Promise.all([
      this.prisma.evidence.count({ where }),
      this.prisma.evidence.aggregate({
        where,
        _sum: { size: true },
      }),
      this.prisma.evidence.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
        _sum: { size: true },
      }),
      this.prisma.evidence.groupBy({
        by: ['runId'],
        where,
        _count: { runId: true },
        _sum: { size: true },
      }),
      this.prisma.evidence.aggregate({
        where,
        _avg: { size: true },
      }),
    ]);

    return {
      total,
      totalSize: totalSize._sum.size || 0,
      byType: byType.map(item => ({
        type: item.type,
        count: item._count.type,
        size: item._sum.size || 0,
      })),
      byRun: byRun.map(item => ({
        runId: item.runId,
        count: item._count.runId,
        size: item._sum.size || 0,
      })),
      avgSize: avgSize._avg.size,
      timeRange: {
        start: createdAfter || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: createdBefore || new Date().toISOString(),
      },
    };
  }

  private calculateHash(data: string): string {
    // In a real implementation, you would use crypto.createHash
    return `sha256:${Buffer.from(data, 'base64').toString('hex').substring(0, 16)}`;
  }

  private getMimeTypeFromName(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'json': 'application/json',
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}