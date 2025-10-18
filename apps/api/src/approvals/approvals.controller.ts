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
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateApprovalRequestSchema,
  UpdateApprovalRequestSchema,
  ApprovalListQuerySchema,
  ApprovalActionRequestSchema,
  ApprovalActionResponseSchema,
  ApprovalReminderRequestSchema,
  ApprovalReminderResponseSchema,
  ApprovalStatsSchema,
  type ApprovalListQuery,
  type CreateApprovalRequest,
  type UpdateApprovalRequest,
  type ApprovalActionRequest,
  type ApprovalReminderRequest,
} from '@schemas/automation';

@ApiTags('approvals')
@Controller('approvals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @ApiOperation({ summary: 'List approvals' })
  @ApiResponse({ status: 200, description: 'List of approvals' })
  async getApprovals(@Query() query: ApprovalListQuery) {
    return this.approvalsService.getApprovals(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval by ID' })
  @ApiResponse({ status: 200, description: 'Approval details' })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  async getApproval(@Param('id') id: string) {
    return this.approvalsService.getApproval(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create approval' })
  @ApiResponse({ status: 201, description: 'Approval created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createApproval(@Body() createApprovalDto: CreateApprovalRequest) {
    return this.approvalsService.createApproval(createApprovalDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update approval' })
  @ApiResponse({ status: 200, description: 'Approval updated' })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  async updateApproval(
    @Param('id') id: string,
    @Body() updateApprovalDto: UpdateApprovalRequest
  ) {
    return this.approvalsService.updateApproval(id, updateApprovalDto);
  }

  @Post(':id/action')
  @ApiOperation({ summary: 'Action approval' })
  @ApiResponse({ status: 200, description: 'Approval action processed' })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  async actionApproval(
    @Param('id') id: string,
    @Body() actionDto: ApprovalActionRequest
  ) {
    return this.approvalsService.actionApproval(id, actionDto);
  }

  @Post(':id/reminder')
  @ApiOperation({ summary: 'Send approval reminder' })
  @ApiResponse({ status: 200, description: 'Reminder sent' })
  @ApiResponse({ status: 404, description: 'Approval not found' })
  async sendReminder(
    @Param('id') id: string,
    @Body() reminderDto: ApprovalReminderRequest
  ) {
    return this.approvalsService.sendReminder(id, reminderDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get approval statistics' })
  @ApiResponse({ status: 200, description: 'Approval statistics' })
  async getApprovalStats(@Query() query: any) {
    return this.approvalsService.getApprovalStats(query);
  }
}