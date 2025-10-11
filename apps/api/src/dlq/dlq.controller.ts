import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DlqService } from './dlq.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

@ApiTags('dlq')
@Controller('dlq')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DlqController {
  constructor(private readonly dlqService: DlqService) {}

  @Get()
  @ApiOperation({ summary: 'List DLQ messages' })
  @ApiResponse({ status: 200, description: 'List of DLQ messages' })
  async getDLQMessages(@Query() query: DLQListQuerySchema) {
    return this.dlqService.getDLQMessages(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get DLQ message by ID' })
  @ApiResponse({ status: 200, description: 'DLQ message details' })
  @ApiResponse({ status: 404, description: 'DLQ message not found' })
  async getDLQMessage(@Param('id') id: string) {
    return this.dlqService.getDLQMessage(id);
  }

  @Post('replay')
  @ApiOperation({ summary: 'Replay DLQ messages' })
  @ApiResponse({ status: 200, description: 'Messages replayed' })
  async replayDLQMessages(@Body() replayDto: DLQReplayRequestSchema) {
    return this.dlqService.replayDLQMessages(replayDto);
  }

  @Post('quarantine')
  @ApiOperation({ summary: 'Quarantine DLQ messages' })
  @ApiResponse({ status: 200, description: 'Messages quarantined' })
  async quarantineDLQMessages(@Body() quarantineDto: DLQQuarantineRequestSchema) {
    return this.dlqService.quarantineDLQMessages(quarantineDto);
  }

  @Post('archive')
  @ApiOperation({ summary: 'Archive DLQ messages' })
  @ApiResponse({ status: 200, description: 'Messages archived' })
  async archiveDLQMessages(@Body() archiveDto: DLQArchiveRequestSchema) {
    return this.dlqService.archiveDLQMessages(archiveDto);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export DLQ messages' })
  @ApiResponse({ status: 200, description: 'Export created' })
  async exportDLQMessages(@Body() exportDto: DLQExportRequestSchema) {
    return this.dlqService.exportDLQMessages(exportDto);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry DLQ message' })
  @ApiResponse({ status: 200, description: 'Message retry initiated' })
  @ApiResponse({ status: 404, description: 'DLQ message not found' })
  async retryDLQMessage(
    @Param('id') id: string,
    @Body() retryDto: DLQRetryRequestSchema
  ) {
    return this.dlqService.retryDLQMessage(id, retryDto);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete DLQ messages' })
  @ApiResponse({ status: 200, description: 'Messages deleted' })
  async deleteDLQMessages(@Body() deleteDto: DLQDeleteRequestSchema) {
    return this.dlqService.deleteDLQMessages(deleteDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get DLQ statistics' })
  @ApiResponse({ status: 200, description: 'DLQ statistics' })
  async getDLQStats(@Query() query: any) {
    return this.dlqService.getDLQStats(query);
  }
}