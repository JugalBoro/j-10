import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserListQuerySchema,
  UserInviteRequestSchema,
  UserInviteResponseSchema,
  AcceptInviteRequestSchema,
  PaginatedResponseSchema,
  UserSchema,
} from '@schemas/automation';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(query: UserListQuerySchema) {
    const {
      orgId,
      role,
      isActive,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          org: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
        org: user.org,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        avatar: user.avatar,
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

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        org: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      org: user.org,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
      avatar: user.avatar,
    };
  }

  async createUser(createUserDto: CreateUserRequestSchema) {
    const { email, name, role, orgId, providerId } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Check if org exists
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        role,
        orgId,
        providerId,
      },
      include: {
        org: true,
      },
    });

    logger.info(`User ${email} created`);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      org: user.org,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
      avatar: user.avatar,
    };
  }

  async updateUser(id: string, updateUserDto: UpdateUserRequestSchema) {
    const { name, role, isActive, avatar } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(avatar && { avatar }),
      },
      include: {
        org: true,
      },
    });

    logger.info(`User ${id} updated`);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      orgId: updatedUser.orgId,
      org: updatedUser.org,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      lastLoginAt: updatedUser.lastLoginAt,
      isActive: updatedUser.isActive,
      avatar: updatedUser.avatar,
    };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    logger.info(`User ${id} deleted`);

    return { message: 'User deleted successfully' };
  }

  async inviteUser(inviteDto: UserInviteRequestSchema) {
    const { email, name, role, message } = inviteDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // In a real implementation, you would:
    // 1. Generate an invitation token
    // 2. Store the invitation in the database
    // 3. Send an email with the invitation link

    const inviteId = `invite-${Date.now()}`;
    const inviteUrl = `https://app.acme.com/invite/${inviteId}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    logger.info(`Invitation sent to ${email}`);

    return {
      inviteId,
      inviteUrl,
      expiresAt,
    };
  }

  async acceptInvite(acceptDto: AcceptInviteRequestSchema) {
    const { token, password } = acceptDto;

    // In a real implementation, you would:
    // 1. Verify the invitation token
    // 2. Create the user account
    // 3. Hash the password
    // 4. Send a welcome email

    logger.info('Invitation accepted');

    return { message: 'Invitation accepted successfully' };
  }
}