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
import { EvidenceService } from './evidence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateEvidenceRequest,
  EvidenceListQuery,
  EvidenceDownloadRequest,
  EvidenceDownloadResponseSchema,
  EvidenceStatsSchema,
} from '@schemas/automation';

@ApiTags('evidence')
@Controller('evidence')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Get()
  @ApiOperation({ summary: 'List evidence' })
  @ApiResponse({ status: 200, description: 'List of evidence' })
  async getEvidence(@Query() query: EvidenceListQuery) {
    return this.evidenceService.getEvidence(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evidence by ID' })
  @ApiResponse({ status: 200, description: 'Evidence details' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async getEvidenceItem(@Param('id') id: string) {
    return this.evidenceService.getEvidenceItem(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create evidence' })
  @ApiResponse({ status: 201, description: 'Evidence created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createEvidence(@Body() createEvidenceDto: CreateEvidenceRequest) {
    return this.evidenceService.createEvidence(createEvidenceDto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download evidence' })
  @ApiResponse({ status: 200, description: 'Download URL generated' })
  @ApiResponse({ status: 404, description: 'Evidence not found' })
  async downloadEvidence(
    @Param('id') id: string,
    @Query() query: EvidenceDownloadRequest
  ) {
    return this.evidenceService.downloadEvidence(id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get evidence statistics' })
  @ApiResponse({ status: 200, description: 'Evidence statistics' })
  async getEvidenceStats(@Query() query: any) {
    return this.evidenceService.getEvidenceStats(query);
  }
}