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
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateScheduleRequestSchema,
  UpdateScheduleRequestSchema,
  ScheduleListQuerySchema,
  ScheduleTestRequestSchema,
  ScheduleTestResponseSchema,
  ScheduleStatsSchema,
} from '@schemas/automation';

@ApiTags('schedules')
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'List schedules' })
  @ApiResponse({ status: 200, description: 'List of schedules' })
  async getSchedules(@Query() query: ScheduleListQuerySchema) {
    return this.schedulesService.getSchedules(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule details' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async getSchedule(@Param('id') id: string) {
    return this.schedulesService.getSchedule(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createSchedule(@Body() createScheduleDto: CreateScheduleRequestSchema) {
    return this.schedulesService.createSchedule(createScheduleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleRequestSchema
  ) {
    return this.schedulesService.updateSchedule(id, updateScheduleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deleted' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async deleteSchedule(@Param('id') id: string) {
    return this.schedulesService.deleteSchedule(id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test schedule' })
  @ApiResponse({ status: 200, description: 'Schedule test result' })
  async testSchedule(@Body() testDto: ScheduleTestRequestSchema) {
    return this.schedulesService.testSchedule(testDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get schedule statistics' })
  @ApiResponse({ status: 200, description: 'Schedule statistics' })
  async getScheduleStats(@Query() query: any) {
    return this.schedulesService.getScheduleStats(query);
  }
}