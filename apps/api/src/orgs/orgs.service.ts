import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  CreateOrgRequestSchema,
  UpdateOrgRequestSchema,
  OrgStatsSchema,
} from '@schemas/automation';

@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService) {}

  async getOrgs(userOrgId: string) {
    const org = await this.prisma.org.findUnique({
      where: { id: userOrgId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: org.id,
      name: org.name,
      plan: org.plan,
      settings: org.settings,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      isActive: org.isActive,
      domain: org.domain,
      logo: org.logo,
      billingEmail: org.billingEmail,
      users: org.users,
    };
  }

  async getOrg(id: string) {
    const org = await this.prisma.org.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: org.id,
      name: org.name,
      plan: org.plan,
      settings: org.settings,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      isActive: org.isActive,
      domain: org.domain,
      logo: org.logo,
      billingEmail: org.billingEmail,
      users: org.users,
    };
  }

  async createOrg(createOrgDto: CreateOrgRequestSchema) {
    const { name, plan, settings, domain, billingEmail } = createOrgDto;

    // Check if domain is already taken
    if (domain) {
      const existingOrg = await this.prisma.org.findFirst({
        where: { domain },
      });

      if (existingOrg) {
        throw new BadRequestException('Domain already taken');
      }
    }

    const org = await this.prisma.org.create({
      data: {
        name,
        plan,
        settings: settings || {},
        domain,
        billingEmail,
      },
    });

    logger.info(`Organization ${name} created`);

    return {
      id: org.id,
      name: org.name,
      plan: org.plan,
      settings: org.settings,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      isActive: org.isActive,
      domain: org.domain,
      logo: org.logo,
      billingEmail: org.billingEmail,
    };
  }

  async updateOrg(id: string, updateOrgDto: UpdateOrgRequestSchema) {
    const { name, plan, settings, domain, billingEmail, isActive, logo } = updateOrgDto;

    const org = await this.prisma.org.findUnique({
      where: { id },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check if domain is already taken by another org
    if (domain && domain !== org.domain) {
      const existingOrg = await this.prisma.org.findFirst({
        where: { 
          domain,
          id: { not: id },
        },
      });

      if (existingOrg) {
        throw new BadRequestException('Domain already taken');
      }
    }

    const updatedOrg = await this.prisma.org.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(plan && { plan }),
        ...(settings && { settings }),
        ...(domain !== undefined && { domain }),
        ...(billingEmail && { billingEmail }),
        ...(isActive !== undefined && { isActive }),
        ...(logo && { logo }),
      },
    });

    logger.info(`Organization ${id} updated`);

    return {
      id: updatedOrg.id,
      name: updatedOrg.name,
      plan: updatedOrg.plan,
      settings: updatedOrg.settings,
      createdAt: updatedOrg.createdAt,
      updatedAt: updatedOrg.updatedAt,
      isActive: updatedOrg.isActive,
      domain: updatedOrg.domain,
      logo: updatedOrg.logo,
      billingEmail: updatedOrg.billingEmail,
    };
  }

  async getOrgStats(id: string) {
    const org = await this.prisma.org.findUnique({
      where: { id },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const [
      totalUsers,
      totalWorkflows,
      totalRuns,
      totalConnectors,
      activeRuns,
      failedRuns,
      lastRun,
      storageUsed,
      apiCallsThisMonth,
    ] = await Promise.all([
      this.prisma.user.count({ where: { orgId: id } }),
      this.prisma.workflow.count({ where: { orgId: id } }),
      this.prisma.run.count({ where: { orgId: id } }),
      this.prisma.connector.count({ where: { orgId: id } }),
      this.prisma.run.count({ 
        where: { 
          orgId: id,
          status: { in: ['QUEUED', 'RUNNING'] },
        },
      }),
      this.prisma.run.count({ 
        where: { 
          orgId: id,
          status: 'FAILED',
        },
      }),
      this.prisma.run.findFirst({
        where: { orgId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.evidence.aggregate({
        where: { run: { orgId: id } },
        _sum: { size: true },
      }),
      // In a real implementation, you would track API calls
      0,
    ]);

    const apiCallsLimit = this.getApiCallsLimit(org.plan);

    return {
      totalUsers,
      totalWorkflows,
      totalRuns,
      totalConnectors,
      activeRuns,
      failedRuns,
      lastRunAt: lastRun?.createdAt,
      storageUsed: storageUsed._sum.size || 0,
      apiCallsThisMonth,
      apiCallsLimit,
    };
  }

  private getApiCallsLimit(plan: string): number {
    const limits = {
      FREE: 1000,
      STARTER: 10000,
      PROFESSIONAL: 100000,
      ENTERPRISE: 1000000,
    };
    return limits[plan] || 1000;
  }
}