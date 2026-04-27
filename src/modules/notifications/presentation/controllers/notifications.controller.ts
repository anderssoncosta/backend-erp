import { Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { NotificationService } from '../../application/services/notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  list(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationService.list(tenantId, user.id, isRead, type, page, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  unreadCount(@CurrentTenant() tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.getUnreadCount(tenantId, user.id).then((count) => ({ count }));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentTenant() tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAllRead(tenantId, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.remove(id, user.id);
  }
}
