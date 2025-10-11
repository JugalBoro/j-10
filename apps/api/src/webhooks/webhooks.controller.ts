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
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateWebhookRequestSchema,
  UpdateWebhookRequestSchema,
  WebhookListQuerySchema,
  WebhookTestRequestSchema,
  WebhookTestResponseSchema,
  WebhookDeliveryListQuerySchema,
  WebhookRetryRequestSchema,
  WebhookRetryResponseSchema,
  WebhookStatsSchema,
} from '@schemas/automation';

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List webhooks' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  async getWebhooks(@Query() query: WebhookListQuerySchema) {
    return this.webhooksService.getWebhooks(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async getWebhook(@Param('id') id: string) {
    return this.webhooksService.getWebhook(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createWebhook(@Body() createWebhookDto: CreateWebhookRequestSchema) {
    return this.webhooksService.createWebhook(createWebhookDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async updateWebhook(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookRequestSchema
  ) {
    return this.webhooksService.updateWebhook(id, updateWebhookDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async deleteWebhook(@Param('id') id: string) {
    return this.webhooksService.deleteWebhook(id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test webhook' })
  @ApiResponse({ status: 200, description: 'Webhook test result' })
  async testWebhook(@Body() testDto: WebhookTestRequestSchema) {
    return this.webhooksService.testWebhook(testDto);
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'List webhook deliveries' })
  @ApiResponse({ status: 200, description: 'List of webhook deliveries' })
  async getWebhookDeliveries(@Query() query: WebhookDeliveryListQuerySchema) {
    return this.webhooksService.getWebhookDeliveries(query);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry webhook delivery' })
  @ApiResponse({ status: 200, description: 'Webhook retry initiated' })
  @ApiResponse({ status: 404, description: 'Webhook delivery not found' })
  async retryWebhookDelivery(
    @Param('id') id: string,
    @Body() retryDto: WebhookRetryRequestSchema
  ) {
    return this.webhooksService.retryWebhookDelivery(id, retryDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get webhook statistics' })
  @ApiResponse({ status: 200, description: 'Webhook statistics' })
  async getWebhookStats(@Query() query: any) {
    return this.webhooksService.getWebhookStats(query);
  }
}