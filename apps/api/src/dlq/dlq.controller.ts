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
  DLQListQuery,
  DLQReplayRequest,
  DLQReplayResponseSchema,
  DLQQuarantineRequest,
  DLQQuarantineResponseSchema,
  DLQArchiveRequest,
  DLQArchiveResponseSchema,
  DLQExportRequest,
  DLQExportResponseSchema,
  DLQStatsSchema,
  DLQRetryRequest,
  DLQRetryResponseSchema,
  DLQDeleteRequest,
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
  async getDLQMessages(@Query() query: DLQListQuery) {
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
  async replayDLQMessages(@Body() replayDto: DLQReplayRequest) {
    return this.dlqService.replayDLQMessages(replayDto);
  }

  @Post('quarantine')
  @ApiOperation({ summary: 'Quarantine DLQ messages' })
  @ApiResponse({ status: 200, description: 'Messages quarantined' })
  async quarantineDLQMessages(@Body() quarantineDto: DLQQuarantineRequest) {
    return this.dlqService.quarantineDLQMessages(quarantineDto);
  }

  @Post('archive')
  @ApiOperation({ summary: 'Archive DLQ messages' })
  @ApiResponse({ status: 200, description: 'Messages archived' })
  async archiveDLQMessages(@Body() archiveDto: DLQArchiveRequest) {
    return this.dlqService.archiveDLQMessages(archiveDto);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export DLQ messages' })
  @ApiResponse({ status: 200, description: 'Export created' })
  async exportDLQMessages(@Body() exportDto: DLQExportRequest) {
    return this.dlqService.exportDLQMessages(exportDto);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry DLQ message' })
  @ApiResponse({ status: 200, description: 'Message retry initiated' })
  @ApiResponse({ status: 404, description: 'DLQ message not found' })
  async retryDLQMessage(
    @Param('id') id: string,
    @Body() retryDto: DLQRetryRequest
  ) {
    return this.dlqService.retryDLQMessage(id, retryDto);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete DLQ messages' })
  @ApiResponse({ status: 200, description: 'Messages deleted' })
  async deleteDLQMessages(@Body() deleteDto: DLQDeleteRequest) {
    return this.dlqService.deleteDLQMessages(deleteDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get DLQ statistics' })
  @ApiResponse({ status: 200, description: 'DLQ statistics' })
  async getDLQStats(@Query() query: any) {
    return this.dlqService.getDLQStats(query);
  }
}