import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CreateServiceOrderUseCase } from '../../application/use-cases/create-service-order/create-service-order.use-case';
import { UpdateServiceOrderUseCase } from '../../application/use-cases/update-service-order/update-service-order.use-case';
import { ListServiceOrdersUseCase } from '../../application/use-cases/list-service-orders/list-service-orders.use-case';
import { GetServiceOrderUseCase } from '../../application/use-cases/get-service-order/get-service-order.use-case';
import { AssignServiceOrderUseCase } from '../../application/use-cases/assign-service-order/assign-service-order.use-case';
import { ChangeStatusUseCase } from '../../application/use-cases/change-status/change-status.use-case';
import { CancelServiceOrderUseCase } from '../../application/use-cases/cancel-service-order/cancel-service-order.use-case';
import { ReopenServiceOrderUseCase } from '../../application/use-cases/reopen-service-order/reopen-service-order.use-case';
import { AddCommentUseCase } from '../../application/use-cases/add-comment/add-comment.use-case';
import { CreateServiceOrderDto } from '../../application/use-cases/create-service-order/create-service-order.dto';
import { UpdateServiceOrderDto } from '../../application/use-cases/update-service-order/update-service-order.dto';
import { ListServiceOrdersQueryDto } from '../../application/use-cases/list-service-orders/list-service-orders.query.dto';
import { AssignServiceOrderDto } from '../../application/use-cases/assign-service-order/assign-service-order.dto';
import { ChangeStatusDto } from '../../application/use-cases/change-status/change-status.dto';
import { CancelServiceOrderDto } from '../../application/use-cases/cancel-service-order/cancel-service-order.dto';
import { AddCommentDto } from '../../application/use-cases/add-comment/add-comment.dto';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { S3Service } from '@infrastructure/storage/s3.service';

@ApiTags('Service Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'service-orders', version: '1' })
export class ServiceOrdersController {
  constructor(
    private readonly createUC: CreateServiceOrderUseCase,
    private readonly updateUC: UpdateServiceOrderUseCase,
    private readonly listUC: ListServiceOrdersUseCase,
    private readonly getUC: GetServiceOrderUseCase,
    private readonly assignUC: AssignServiceOrderUseCase,
    private readonly changeStatusUC: ChangeStatusUseCase,
    private readonly cancelUC: CancelServiceOrderUseCase,
    private readonly reopenUC: ReopenServiceOrderUseCase,
    private readonly addCommentUC: AddCommentUseCase,
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create service order' })
  @Permissions('service-orders', 'create')
  create(
    @Body() dto: CreateServiceOrderDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createUC.execute(dto, tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List service orders' })
  @Permissions('service-orders', 'read')
  findAll(
    @Query() query: ListServiceOrdersQueryDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.listUC.execute(query, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service order by ID' })
  @Permissions('service-orders', 'read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.getUC.execute(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service order' })
  @Permissions('service-orders', 'update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceOrderDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.updateUC.execute(id, dto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete service order' })
  @Permissions('service-orders', 'delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    await this.prisma.serviceOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Service order deleted' };
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign technician to service order' })
  @Permissions('service-orders', 'update')
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignServiceOrderDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assignUC.execute(id, dto, tenantId, user.id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Change service order status' })
  @Permissions('service-orders', 'update')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.changeStatusUC.execute(id, dto, tenantId, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel service order' })
  @Permissions('service-orders', 'update')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelServiceOrderDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cancelUC.execute(id, dto, tenantId, user.id);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen service order' })
  @Permissions('service-orders', 'update')
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reopenUC.execute(id, tenantId, user.id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to service order' })
  @Permissions('service-orders', 'update')
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.addCommentUC.execute(id, dto, tenantId, user.id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List service order comments' })
  @Permissions('service-orders', 'read')
  getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prisma.serviceOrderComment.findMany({
      where: {
        serviceOrderId: id,
        deletedAt: null,
        OR: [
          { isInternal: false },
          { isInternal: true, authorId: user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get service order history' })
  @Permissions('service-orders', 'read')
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.serviceOrderHistory.findMany({
      where: { serviceOrderId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload attachment to service order' })
  @ApiConsumes('multipart/form-data')
  @Permissions('service-orders', 'update')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.s3.upload(file, tenantId, {
      folder: `service-orders/${id}`,
    });

    return this.prisma.serviceOrderAttachment.create({
      data: {
        serviceOrderId: id,
        uploadedById: user.id,
        fileName: result.key.split('/').pop() ?? file.originalname,
        originalName: file.originalname,
        mimeType: result.mimeType,
        size: result.size,
        s3Key: result.key,
        s3Bucket: result.bucket,
      },
    });
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'List service order attachments' })
  @Permissions('service-orders', 'read')
  async getAttachments(@Param('id', ParseUUIDPipe) id: string) {
    const attachments = await this.prisma.serviceOrderAttachment.findMany({
      where: { serviceOrderId: id },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      attachments.map(async (a) => ({
        ...a,
        url: await this.s3.getPresignedUrl(a.s3Bucket, a.s3Key),
      })),
    );
  }
}
