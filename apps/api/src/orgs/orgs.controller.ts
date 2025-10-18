import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrgsService } from './orgs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateOrgRequest,
  UpdateOrgRequest,
  OrgStatsSchema,
} from '@schemas/automation';

@ApiTags('orgs')
@Controller('orgs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Get()
  @ApiOperation({ summary: 'List organizations' })
  @ApiResponse({ status: 200, description: 'List of organizations' })
  async getOrgs(@Request() req: any) {
    return this.orgsService.getOrgs(req.user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrg(@Param('id') id: string) {
    return this.orgsService.getOrg(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createOrg(@Body() createOrgDto: CreateOrgRequest) {
    return this.orgsService.createOrg(createOrgDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async updateOrg(
    @Param('id') id: string,
    @Body() updateOrgDto: UpdateOrgRequest
  ) {
    return this.orgsService.updateOrg(id, updateOrgDto);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, description: 'Organization statistics' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getOrgStats(@Param('id') id: string) {
    return this.orgsService.getOrgStats(id);
  }
}