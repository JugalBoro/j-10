import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConnectorsService } from './connectors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateConnectorRequest,
  UpdateConnectorRequest,
  ConnectorTestRequest,
  ConnectorTestResponse,
  ConnectorInstallRequest,
  ConnectorInstallResponse,
  ConnectorCallbackRequest,
  ConnectorListQuery,
  ConnectorRotateSecretsRequest,
} from '@schemas/automation';

@ApiTags('connectors')
@Controller('connectors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConnectorsController {
  constructor(private readonly connectorsService: ConnectorsService) {}

  @Get()
  @ApiOperation({ summary: 'List connectors' })
  @ApiResponse({ status: 200, description: 'List of connectors' })
  async getConnectors(@Query() query: ConnectorListQuery) {
    return this.connectorsService.getConnectors(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get connector by ID' })
  @ApiResponse({ status: 200, description: 'Connector details' })
  @ApiResponse({ status: 404, description: 'Connector not found' })
  async getConnector(@Param('id') id: string) {
    return this.connectorsService.getConnector(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create connector' })
  @ApiResponse({ status: 201, description: 'Connector created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createConnector(@Body() createConnectorDto: CreateConnectorRequest) {
    return this.connectorsService.createConnector(createConnectorDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update connector' })
  @ApiResponse({ status: 200, description: 'Connector updated' })
  @ApiResponse({ status: 404, description: 'Connector not found' })
  async updateConnector(
    @Param('id') id: string,
    @Body() updateConnectorDto: UpdateConnectorRequest
  ) {
    return this.connectorsService.updateConnector(id, updateConnectorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete connector' })
  @ApiResponse({ status: 200, description: 'Connector deleted' })
  @ApiResponse({ status: 404, description: 'Connector not found' })
  async deleteConnector(@Param('id') id: string) {
    return this.connectorsService.deleteConnector(id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test connector configuration' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async testConnector(@Body() testDto: ConnectorTestRequest) {
    return this.connectorsService.testConnector(testDto);
  }

  @Post('install')
  @ApiOperation({ summary: 'Install connector' })
  @ApiResponse({ status: 200, description: 'Installation initiated' })
  async installConnector(@Body() installDto: ConnectorInstallRequest) {
    return this.connectorsService.installConnector(installDto);
  }

  @Post('callback')
  @ApiOperation({ summary: 'OAuth callback' })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async connectorCallback(@Body() callbackDto: ConnectorCallbackRequest) {
    return this.connectorsService.connectorCallback(callbackDto);
  }

  @Post(':id/rotate-secrets')
  @ApiOperation({ summary: 'Rotate connector secrets' })
  @ApiResponse({ status: 200, description: 'Secrets rotated' })
  async rotateSecrets(
    @Param('id') id: string,
    @Body() rotateDto: ConnectorRotateSecretsRequest
  ) {
    return this.connectorsService.rotateSecrets(id, rotateDto);
  }
}