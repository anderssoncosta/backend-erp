import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { HelpdeskService } from '../../application/services/helpdesk.service';

@ApiTags('Helpdesk')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'helpdesk', version: '1' })
export class HelpdeskController {
  constructor(private readonly helpdeskService: HelpdeskService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create ticket' })
  @Permissions('helpdesk', 'create')
  createTicket(
    @Body() body: { title: string; description: string; category: string; priority?: string; assignedToId?: string; serviceOrderId?: string },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.helpdeskService.createTicket(tenantId, user.id, body);
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
    return this.helpdeskService.listTickets(tenantId, status, priority, assignedToId, page, limit);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @Permissions('helpdesk', 'read')
  getTicket(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.helpdeskService.getTicket(id, tenantId);
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Update ticket' })
  @Permissions('helpdesk', 'update')
  updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status?: string; priority?: string; assignedToId?: string; resolvedAt?: string; resolution?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.helpdeskService.updateTicket(id, tenantId, body);
  }

  @Post('tickets/:id/comments')
  @ApiOperation({ summary: 'Add comment to ticket' })
  @Permissions('helpdesk', 'create')
  addComment(
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() body: { content: string; isInternal?: boolean },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.helpdeskService.addComment(ticketId, user.id, body.content, body.isInternal);
  }
}
