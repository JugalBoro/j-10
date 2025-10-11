import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  CreateConnectorRequestSchema,
  UpdateConnectorRequestSchema,
  ConnectorTestRequestSchema,
  ConnectorTestResponseSchema,
  ConnectorInstallRequestSchema,
  ConnectorInstallResponseSchema,
  ConnectorCallbackRequestSchema,
  ConnectorListQuerySchema,
  ConnectorRotateSecretsRequestSchema,
} from '@schemas/automation';

@Injectable()
export class ConnectorsService {
  constructor(private prisma: PrismaService) {}

  async getConnectors(query: ConnectorListQuerySchema) {
    const {
      orgId,
      type,
      status,
      isSandbox,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (isSandbox !== undefined) {
      where.isSandbox = isSandbox;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [connectors, total] = await Promise.all([
      this.prisma.connector.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          org: true,
        },
      }),
      this.prisma.connector.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: connectors.map((connector) => ({
        id: connector.id,
        orgId: connector.orgId,
        type: connector.type,
        name: connector.name,
        status: connector.status,
        settings: connector.settings,
        secretsKmsRef: connector.secretsKmsRef,
        health: connector.health,
        createdAt: connector.createdAt,
        updatedAt: connector.updatedAt,
        lastUsedAt: connector.lastUsedAt,
        isSandbox: connector.isSandbox,
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

  async getConnector(id: string) {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
      include: {
        org: true,
      },
    });

    if (!connector) {
      throw new NotFoundException('Connector not found');
    }

    return {
      id: connector.id,
      orgId: connector.orgId,
      type: connector.type,
      name: connector.name,
      status: connector.status,
      settings: connector.settings,
      secretsKmsRef: connector.secretsKmsRef,
      health: connector.health,
      createdAt: connector.createdAt,
      updatedAt: connector.updatedAt,
      lastUsedAt: connector.lastUsedAt,
      isSandbox: connector.isSandbox,
    };
  }

  async createConnector(createConnectorDto: CreateConnectorRequestSchema) {
    const { type, name, settings, secrets, isSandbox } = createConnectorDto;

    // In a real implementation, you would:
    // 1. Validate the connector type
    // 2. Encrypt and store secrets securely
    // 3. Test the connection

    const connector = await this.prisma.connector.create({
      data: {
        type,
        name,
        settings: settings || {},
        secretsKmsRef: secrets ? 'encrypted-secret-ref' : null,
        isSandbox: isSandbox || false,
        orgId: 'demo-org-1', // In real implementation, get from user context
      },
    });

    logger.info(`Connector ${name} created`);

    return {
      id: connector.id,
      orgId: connector.orgId,
      type: connector.type,
      name: connector.name,
      status: connector.status,
      settings: connector.settings,
      secretsKmsRef: connector.secretsKmsRef,
      health: connector.health,
      createdAt: connector.createdAt,
      updatedAt: connector.updatedAt,
      lastUsedAt: connector.lastUsedAt,
      isSandbox: connector.isSandbox,
    };
  }

  async updateConnector(id: string, updateConnectorDto: UpdateConnectorRequestSchema) {
    const { name, settings, secrets, isSandbox } = updateConnectorDto;

    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new NotFoundException('Connector not found');
    }

    const updatedConnector = await this.prisma.connector.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(settings && { settings }),
        ...(secrets && { secretsKmsRef: 'encrypted-secret-ref' }),
        ...(isSandbox !== undefined && { isSandbox }),
      },
    });

    logger.info(`Connector ${id} updated`);

    return {
      id: updatedConnector.id,
      orgId: updatedConnector.orgId,
      type: updatedConnector.type,
      name: updatedConnector.name,
      status: updatedConnector.status,
      settings: updatedConnector.settings,
      secretsKmsRef: updatedConnector.secretsKmsRef,
      health: updatedConnector.health,
      createdAt: updatedConnector.createdAt,
      updatedAt: updatedConnector.updatedAt,
      lastUsedAt: updatedConnector.lastUsedAt,
      isSandbox: updatedConnector.isSandbox,
    };
  }

  async deleteConnector(id: string) {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new NotFoundException('Connector not found');
    }

    await this.prisma.connector.delete({
      where: { id },
    });

    logger.info(`Connector ${id} deleted`);

    return { message: 'Connector deleted successfully' };
  }

  async testConnector(testDto: ConnectorTestRequestSchema) {
    const { settings, secrets } = testDto;

    // In a real implementation, you would:
    // 1. Validate the settings
    // 2. Test the connection using the provided credentials
    // 3. Return detailed test results

    const startTime = Date.now();
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        message: 'Connection test successful',
        latency,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Connection test failed',
        error: error.message,
      };
    }
  }

  async installConnector(installDto: ConnectorInstallRequestSchema) {
    const { type, redirectUri, state } = installDto;

    // In a real implementation, you would:
    // 1. Generate OAuth URLs for different providers
    // 2. Store the state for verification
    // 3. Return the appropriate auth URL

    const authUrl = `https://oauth.example.com/${type}?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return {
      authUrl,
      state,
    };
  }

  async connectorCallback(callbackDto: ConnectorCallbackRequestSchema) {
    const { type, code, state, error } = callbackDto;

    if (error) {
      throw new BadRequestException(`OAuth error: ${error}`);
    }

    // In a real implementation, you would:
    // 1. Verify the state parameter
    // 2. Exchange the code for tokens
    // 3. Store the tokens securely
    // 4. Create or update the connector

    logger.info(`OAuth callback received for ${type}`);

    return { message: 'OAuth callback processed successfully' };
  }

  async rotateSecrets(id: string, rotateDto: ConnectorRotateSecretsRequestSchema) {
    const { secrets } = rotateDto;

    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new NotFoundException('Connector not found');
    }

    // In a real implementation, you would:
    // 1. Encrypt the new secrets
    // 2. Update the KMS reference
    // 3. Test the new credentials
    // 4. Update the connector

    await this.prisma.connector.update({
      where: { id },
      data: {
        secretsKmsRef: 'new-encrypted-secret-ref',
        updatedAt: new Date(),
      },
    });

    logger.info(`Secrets rotated for connector ${id}`);

    return { message: 'Secrets rotated successfully' };
  }
}