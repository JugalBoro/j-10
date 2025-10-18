import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheck } from '@schemas/automation';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getHealth(): Promise<HealthCheck> {
    const services = await this.checkServices();
    const overallStatus = this.determineOverallStatus(services);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
    };
  }

  async getReadiness(): Promise<{ status: string }> {
    const services = await this.checkServices();
    const isReady = Object.values(services).every(
      (service) => service.status === 'healthy'
    );

    return {
      status: isReady ? 'ready' : 'not ready',
    };
  }

  async getLiveness(): Promise<{ status: string }> {
    return {
      status: 'alive',
    };
  }

  private async checkServices() {
    const services: Record<string, any> = {};

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.database = {
        status: 'healthy',
        latency: 0, // In a real implementation, measure actual latency
      };
    } catch (error) {
      services.database = {
        status: 'unhealthy',
        error: error.message,
      };
    }

    // Check Redis (if configured)
    // In a real implementation, you would check Redis connectivity

    // Check external services
    // In a real implementation, you would check S3, email service, etc.

    return services;
  }

  private determineOverallStatus(services: Record<string, any>): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(services).map((service) => service.status);
    
    if (statuses.every((status) => status === 'healthy')) {
      return 'healthy';
    }
    
    if (statuses.some((status) => status === 'unhealthy')) {
      return 'unhealthy';
    }
    
    return 'degraded';
  }
}