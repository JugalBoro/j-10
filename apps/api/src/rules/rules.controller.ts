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
import { RulesService } from './rules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateRuleRequest,
  UpdateRuleRequest,
  RuleListQuery,
  RuleTestRequest,
  RuleTestResponseSchema,
  RuleEvaluateRequest,
  RuleEvaluateResponseSchema,
  RuleStatsSchema,
} from '@schemas/automation';

@ApiTags('rules')
@Controller('rules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOperation({ summary: 'List rules' })
  @ApiResponse({ status: 200, description: 'List of rules' })
  async getRules(@Query() query: RuleListQuery) {
    return this.rulesService.getRules(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rule by ID' })
  @ApiResponse({ status: 200, description: 'Rule details' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async getRule(@Param('id') id: string) {
    return this.rulesService.getRule(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create rule' })
  @ApiResponse({ status: 201, description: 'Rule created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createRule(@Body() createRuleDto: CreateRuleRequest) {
    return this.rulesService.createRule(createRuleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update rule' })
  @ApiResponse({ status: 200, description: 'Rule updated' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async updateRule(
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateRuleRequest
  ) {
    return this.rulesService.updateRule(id, updateRuleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete rule' })
  @ApiResponse({ status: 200, description: 'Rule deleted' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async deleteRule(@Param('id') id: string) {
    return this.rulesService.deleteRule(id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test rule' })
  @ApiResponse({ status: 200, description: 'Rule test result' })
  async testRule(@Body() testDto: RuleTestRequest) {
    return this.rulesService.testRule(testDto);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate rule' })
  @ApiResponse({ status: 200, description: 'Rule evaluation result' })
  async evaluateRule(@Body() evaluateDto: RuleEvaluateRequest) {
    return this.rulesService.evaluateRule(evaluateDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get rule statistics' })
  @ApiResponse({ status: 200, description: 'Rule statistics' })
  async getRuleStats(@Query() query: any) {
    return this.rulesService.getRuleStats(query);
  }
}