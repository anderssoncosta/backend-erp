import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '@shared/presentation/decorators/current-user.decorator';
import { CallCenterService } from '../../application/services/call-center.service';

@ApiTags('Call Center')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'call-center', version: '1' })
export class CallCenterController {
  constructor(private readonly callCenterService: CallCenterService) {}

  @Post('calls')
  @ApiOperation({ summary: 'Register call record' })
  @Permissions('call-center', 'create')
  registerCall(
    @Body()
    body: {
      clientPhone: string;
      subject: string;
      description?: string;
      clientId?: string;
      clientName?: string;
      channel?: string;
      serviceOrderId?: string;
      notes?: string;
    },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.callCenterService.registerCall(tenantId, user.id, body);
  }

  @Patch('calls/:id/end')
  @ApiOperation({ summary: 'End a call' })
  @Permissions('call-center', 'update')
  endCall(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { notes?: string; outcome?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.callCenterService.endCall(id, tenantId, body.notes, body.outcome);
  }

  @Get('calls')
  @ApiOperation({ summary: 'List calls' })
  @Permissions('call-center', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('attendantId') attendantId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.callCenterService.list(
      tenantId,
      attendantId,
      clientId,
      status,
      from,
      to,
      page,
      limit,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Call center statistics' })
  @Permissions('call-center', 'read')
  stats(@CurrentTenant() tenantId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.callCenterService.stats(tenantId, from, to);
  }
}
