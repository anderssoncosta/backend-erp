import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Helpdesk')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'helpdesk', version: '1' })
export class HelpdeskController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create ticket' })
  @Permissions('helpdesk', 'create')
  createTicket(
    @Body() body: {
      title: string; description: string; category: string;
      priority?: string; assignedToId?: string; serviceOrderId?: string;
    },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prisma.ticket.create({
      data: {
        tenantId,
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority ?? 'MEDIUM',
        requesterId: user.id,
        assignedToId: body.assignedToId,
        serviceOrderId: body.serviceOrderId,
        status: 'OPEN',
      },
    });
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List tickets' })
  @Permissions('helpdesk', 'read')
  listTickets(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.prisma.ticket.findMany({
      where: {
        tenantId,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
      },
      include: { _count: { select: { comments: true } } },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @Permissions('helpdesk', 'read')
  getTicket(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.ticket.findFirst({
      where: { id, tenantId },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Update ticket' })
  @Permissions('helpdesk', 'update')
  updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status?: string; priority?: string; assignedToId?: string; resolvedAt?: string; resolution?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.ticket.updateMany({
      where: { id, tenantId },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.priority && { priority: body.priority }),
        ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
        ...(body.resolvedAt && { resolvedAt: new Date(body.resolvedAt) }),
        ...(body.resolution && { resolution: body.resolution }),
        ...(body.status === 'RESOLVED' && !body.resolvedAt && { resolvedAt: new Date() }),
        ...(body.status === 'CLOSED' && { closedAt: new Date() }),
      },
    });
  }

  @Post('tickets/:id/comments')
  @ApiOperation({ summary: 'Add comment to ticket' })
  @Permissions('helpdesk', 'create')
  addComment(
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() body: { content: string; isInternal?: boolean },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: user.id,
        content: body.content,
        isInternal: body.isInternal ?? false,
      },
    });
  }
}
