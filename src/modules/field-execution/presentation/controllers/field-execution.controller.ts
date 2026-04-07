import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CheckInUseCase } from '../../application/use-cases/check-in/check-in.use-case';
import { CheckOutUseCase } from '../../application/use-cases/check-out/check-out.use-case';
import { CheckInDto } from '../../application/use-cases/check-in/check-in.dto';
import { CheckOutDto } from '../../application/use-cases/check-out/check-out.dto';

@ApiTags('Field Execution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'field-execution', version: '1' })
export class FieldExecutionController {
  constructor(
    private readonly checkInUseCase: CheckInUseCase,
    private readonly checkOutUseCase: CheckOutUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check in to a service order' })
  @Permissions('field-execution', 'create')
  checkIn(
    @Body() dto: CheckInDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.checkInUseCase.execute(dto, tenantId, user.id);
  }

  @Patch(':id/check-out')
  @ApiOperation({ summary: 'Check out from a service order' })
  @Permissions('field-execution', 'update')
  checkOut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckOutDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.checkOutUseCase.execute(id, dto, tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List field executions' })
  @Permissions('field-execution', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('userId') userId?: string,
    @Query('serviceOrderId') serviceOrderId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.prisma.fieldExecution.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
        ...(serviceOrderId && { serviceOrderId }),
        ...(status && { status }),
      },
      orderBy: { checkInAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get field execution by ID' })
  @Permissions('field-execution', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.fieldExecution.findFirst({
      where: { id, tenantId },
      include: {
        checklists: true,
        evidences: true,
      },
    });
  }

  @Post(':id/evidences')
  @ApiOperation({ summary: 'Add evidence to field execution' })
  @Permissions('field-execution', 'create')
  addEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { type: string; url: string; description?: string },
    @CurrentTenant() _tenantId: string,
  ) {
    return this.prisma.fieldEvidence.create({
      data: {
        executionId: id,
        type: body.type,
        url: body.url,
        description: body.description,
      },
    });
  }

  @Post(':id/checklists')
  @ApiOperation({ summary: 'Save checklist for field execution' })
  @Permissions('field-execution', 'create')
  saveChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { question: string; passed?: boolean; notes?: string; order?: number },
    @CurrentTenant() _tenantId: string,
  ) {
    return this.prisma.fieldChecklist.create({
      data: {
        executionId: id,
        question: body.question,
        passed: body.passed,
        notes: body.notes,
        order: body.order ?? 0,
      },
    });
  }
}
