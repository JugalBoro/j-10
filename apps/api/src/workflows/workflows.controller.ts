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
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateWorkflowRequestSchema,
  UpdateWorkflowRequestSchema,
  WorkflowListQuerySchema,
  WorkflowRunRequestSchema,
  WorkflowRunResponseSchema,
  WorkflowTestRequestSchema,
  WorkflowTestResponseSchema,
} from '@schemas/automation';

@ApiTags('workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  @ApiOperation({ summary: 'List workflows' })
  @ApiResponse({ status: 200, description: 'List of workflows' })
  async getWorkflows(@Query() query: WorkflowListQuerySchema) {
    return this.workflowsService.getWorkflows(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiResponse({ status: 200, description: 'Workflow details' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getWorkflow(@Param('id') id: string) {
    return this.workflowsService.getWorkflow(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createWorkflow(@Body() createWorkflowDto: CreateWorkflowRequestSchema) {
    return this.workflowsService.createWorkflow(createWorkflowDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workflow' })
  @ApiResponse({ status: 200, description: 'Workflow updated' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async updateWorkflow(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowRequestSchema
  ) {
    return this.workflowsService.updateWorkflow(id, updateWorkflowDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiResponse({ status: 200, description: 'Workflow deleted' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async deleteWorkflow(@Param('id') id: string) {
    return this.workflowsService.deleteWorkflow(id);
  }

  @Post('run')
  @ApiOperation({ summary: 'Run workflow' })
  @ApiResponse({ status: 200, description: 'Workflow run initiated' })
  async runWorkflow(@Body() runDto: WorkflowRunRequestSchema) {
    return this.workflowsService.runWorkflow(runDto);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test workflow' })
  @ApiResponse({ status: 200, description: 'Workflow test result' })
  async testWorkflow(@Body() testDto: WorkflowTestRequestSchema) {
    return this.workflowsService.testWorkflow(testDto);
  }
}