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
import { RunsService } from './runs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  RunListQuery,
  RunRetryRequest,
  RunCancelRequest,
  RunLogsQuery,
  RunLogsResponseSchema,
  RunStatsSchema,
} from '@schemas/automation';

@ApiTags('runs')
@Controller('runs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Get()
  @ApiOperation({ summary: 'List runs' })
  @ApiResponse({ status: 200, description: 'List of runs' })
  async getRuns(@Query() query: RunListQuery) {
    return this.runsService.getRuns(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get run by ID' })
  @ApiResponse({ status: 200, description: 'Run details' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  async getRun(@Param('id') id: string) {
    return this.runsService.getRun(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry run' })
  @ApiResponse({ status: 200, description: 'Run retry initiated' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  async retryRun(
    @Param('id') id: string,
    @Body() retryDto: RunRetryRequest
  ) {
    return this.runsService.retryRun(id, retryDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel run' })
  @ApiResponse({ status: 200, description: 'Run cancelled' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  async cancelRun(
    @Param('id') id: string,
    @Body() cancelDto: RunCancelRequest
  ) {
    return this.runsService.cancelRun(id, cancelDto);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get run logs' })
  @ApiResponse({ status: 200, description: 'Run logs' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  async getRunLogs(
    @Param('id') id: string,
    @Query() query: RunLogsQuery
  ) {
    return this.runsService.getRunLogs(id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get run statistics' })
  @ApiResponse({ status: 200, description: 'Run statistics' })
  async getRunStats(@Query() query: any) {
    return this.runsService.getRunStats(query);
  }
}