import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  CreateRuleRequestSchema,
  UpdateRuleRequestSchema,
  RuleListQuerySchema,
  RuleTestRequestSchema,
  RuleTestResponseSchema,
  RuleEvaluateRequestSchema,
  RuleEvaluateResponseSchema,
  RuleStatsSchema,
} from '@schemas/automation';

@Injectable()
export class RulesService {
  constructor(private prisma: PrismaService) {}

  async getRules(query: RuleListQuerySchema) {
    const {
      orgId,
      enabled,
      tags,
      search,
      createdBy,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    const [rules, total] = await Promise.all([
      this.prisma.rule.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priority: 'desc' },
        include: {
          org: true,
        },
      }),
      this.prisma.rule.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: rules.map((rule) => ({
        id: rule.id,
        orgId: rule.orgId,
        name: rule.name,
        description: rule.description,
        jsonLogic: rule.jsonLogic,
        enabled: rule.enabled,
        priority: rule.priority,
        tags: rule.tags,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        createdBy: rule.createdBy,
        lastUsedAt: rule.lastUsedAt,
        usageCount: rule.usageCount,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getRule(id: string) {
    const rule = await this.prisma.rule.findUnique({
      where: { id },
      include: {
        org: true,
      },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    return {
      id: rule.id,
      orgId: rule.orgId,
      name: rule.name,
      description: rule.description,
      jsonLogic: rule.jsonLogic,
      enabled: rule.enabled,
      priority: rule.priority,
      tags: rule.tags,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      createdBy: rule.createdBy,
      lastUsedAt: rule.lastUsedAt,
      usageCount: rule.usageCount,
    };
  }

  async createRule(createRuleDto: CreateRuleRequestSchema) {
    const { name, description, jsonLogic, enabled, priority, tags } = createRuleDto;

    // Validate JSON Logic
    if (!this.isValidJsonLogic(jsonLogic)) {
      throw new BadRequestException('Invalid JSON Logic expression');
    }

    const rule = await this.prisma.rule.create({
      data: {
        name,
        description,
        jsonLogic,
        enabled: enabled || true,
        priority: priority || 50,
        tags: tags || [],
        orgId: 'demo-org-1', // In real implementation, get from user context
        createdBy: 'admin-user-1', // In real implementation, get from user context
      },
    });

    logger.info(`Rule ${name} created`);

    return {
      id: rule.id,
      orgId: rule.orgId,
      name: rule.name,
      description: rule.description,
      jsonLogic: rule.jsonLogic,
      enabled: rule.enabled,
      priority: rule.priority,
      tags: rule.tags,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      createdBy: rule.createdBy,
      lastUsedAt: rule.lastUsedAt,
      usageCount: rule.usageCount,
    };
  }

  async updateRule(id: string, updateRuleDto: UpdateRuleRequestSchema) {
    const { name, description, jsonLogic, enabled, priority, tags } = updateRuleDto;

    const rule = await this.prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    // Validate JSON Logic if provided
    if (jsonLogic && !this.isValidJsonLogic(jsonLogic)) {
      throw new BadRequestException('Invalid JSON Logic expression');
    }

    const updatedRule = await this.prisma.rule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(jsonLogic && { jsonLogic }),
        ...(enabled !== undefined && { enabled }),
        ...(priority && { priority }),
        ...(tags && { tags }),
      },
    });

    logger.info(`Rule ${id} updated`);

    return {
      id: updatedRule.id,
      orgId: updatedRule.orgId,
      name: updatedRule.name,
      description: updatedRule.description,
      jsonLogic: updatedRule.jsonLogic,
      enabled: updatedRule.enabled,
      priority: updatedRule.priority,
      tags: updatedRule.tags,
      createdAt: updatedRule.createdAt,
      updatedAt: updatedRule.updatedAt,
      createdBy: updatedRule.createdBy,
      lastUsedAt: updatedRule.lastUsedAt,
      usageCount: updatedRule.usageCount,
    };
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    await this.prisma.rule.delete({
      where: { id },
    });

    logger.info(`Rule ${id} deleted`);

    return { message: 'Rule deleted successfully' };
  }

  async testRule(testDto: RuleTestRequestSchema) {
    const { jsonLogic, data } = testDto;

    if (!this.isValidJsonLogic(jsonLogic)) {
      throw new BadRequestException('Invalid JSON Logic expression');
    }

    const startTime = Date.now();

    try {
      const result = this.evaluateJsonLogic(jsonLogic, data);
      const executionTime = Date.now() - startTime;

      return {
        result,
        executionTime,
        debug: {
          steps: [
            {
              step: 'evaluate',
              result,
              duration: executionTime,
            },
          ],
          variables: data,
        },
      };
    } catch (error) {
      return {
        result: false,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async evaluateRule(evaluateDto: RuleEvaluateRequestSchema) {
    const { ruleId, data, context } = evaluateDto;

    const rule = await this.prisma.rule.findUnique({
      where: { id: ruleId },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (!rule.enabled) {
      throw new BadRequestException('Rule is disabled');
    }

    const startTime = Date.now();

    try {
      const result = this.evaluateJsonLogic(rule.jsonLogic, { ...data, ...context });
      const executionTime = Date.now() - startTime;

      // Update usage count
      await this.prisma.rule.update({
        where: { id: ruleId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      return {
        result,
        executionTime,
        debug: {
          steps: [
            {
              step: 'evaluate',
              result,
              duration: executionTime,
            },
          ],
          variables: { ...data, ...context },
        },
      };
    } catch (error) {
      return {
        result: false,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async getRuleStats(query: any) {
    const { orgId } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    const [total, enabled, disabled, byPriority, mostUsed, avgExecutionTime, errorRate] = await Promise.all([
      this.prisma.rule.count({ where }),
      this.prisma.rule.count({ where: { ...where, enabled: true } }),
      this.prisma.rule.count({ where: { ...where, enabled: false } }),
      this.prisma.rule.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true },
      }),
      this.prisma.rule.findMany({
        where,
        orderBy: { usageCount: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          usageCount: true,
        },
      }),
      // In a real implementation, you would track execution times
      100, // Mock value
      // In a real implementation, you would track error rates
      0.05, // Mock value
    ]);

    return {
      total,
      enabled,
      disabled,
      byPriority: byPriority.map(item => ({
        priority: item.priority,
        count: item._count.priority,
      })),
      mostUsed: mostUsed.map(rule => ({
        ruleId: rule.id,
        ruleName: rule.name,
        usageCount: rule.usageCount,
      })),
      avgExecutionTime,
      errorRate,
    };
  }

  private isValidJsonLogic(jsonLogic: any): boolean {
    if (!jsonLogic || typeof jsonLogic !== 'object') {
      return false;
    }

    // Basic validation - in a real implementation, you would use a proper JSON Logic validator
    const validOperators = [
      'and', 'or', 'not', 'if', '==', '!=', '>', '>=', '<', '<=',
      'in', '!in', 'contains', '!contains', 'startsWith', 'endsWith',
      'matches', '!matches', 'var', 'missing', 'missing_some',
      '+', '-', '*', '/', '%', 'min', 'max', 'merge', 'cat',
      'substr', 'log'
    ];

    for (const key in jsonLogic) {
      if (validOperators.includes(key)) {
        return true;
      }
    }

    return false;
  }

  private evaluateJsonLogic(jsonLogic: any, data: any): boolean {
    // In a real implementation, you would use a proper JSON Logic evaluator
    // This is a simplified version for demonstration

    if (jsonLogic.and) {
      return jsonLogic.and.every((condition: any) => this.evaluateJsonLogic(condition, data));
    }

    if (jsonLogic.or) {
      return jsonLogic.or.some((condition: any) => this.evaluateJsonLogic(condition, data));
    }

    if (jsonLogic.not) {
      return !this.evaluateJsonLogic(jsonLogic.not, data);
    }

    if (jsonLogic['==']) {
      const [left, right] = jsonLogic['=='];
      return this.getValue(left, data) === this.getValue(right, data);
    }

    if (jsonLogic['!=']) {
      const [left, right] = jsonLogic['!='];
      return this.getValue(left, data) !== this.getValue(right, data);
    }

    if (jsonLogic['>']) {
      const [left, right] = jsonLogic['>'];
      return this.getValue(left, data) > this.getValue(right, data);
    }

    if (jsonLogic['>=']) {
      const [left, right] = jsonLogic['>='];
      return this.getValue(left, data) >= this.getValue(right, data);
    }

    if (jsonLogic['<']) {
      const [left, right] = jsonLogic['<'];
      return this.getValue(left, data) < this.getValue(right, data);
    }

    if (jsonLogic['<=']) {
      const [left, right] = jsonLogic['<='];
      return this.getValue(left, data) <= this.getValue(right, data);
    }

    if (jsonLogic.in) {
      const [value, array] = jsonLogic.in;
      return array.includes(this.getValue(value, data));
    }

    if (jsonLogic.contains) {
      const [haystack, needle] = jsonLogic.contains;
      return this.getValue(haystack, data).includes(this.getValue(needle, data));
    }

    if (jsonLogic.var) {
      return this.getValue(jsonLogic.var, data);
    }

    return false;
  }

  private getValue(expression: any, data: any): any {
    if (typeof expression === 'string' && expression.startsWith('$')) {
      const path = expression.substring(1);
      return this.getNestedValue(data, path);
    }
    return expression;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}