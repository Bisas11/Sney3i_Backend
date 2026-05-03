import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReasonDto } from './dto/reason.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserDataDto } from '../users/dto/update-user-data.dto';
import { AdminCreateServiceDto, AdminUpdateServiceDto } from './dto/admin-service.dto';

// Seed endpoint removed — seeding is provided via the CLI script (src/seed.ts)

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiTags('Admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Added admin review listing so the admin panel can moderate reviews even when
   * there is no report. Existing delete endpoint remains the moderation action.
   */
  @Get('reviews')
  @ApiOperation({ summary: 'List all non-deleted reviews for admin moderation' })
  listReviews() {
    return this.adminService.listReviews();
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete review and apply moderation counters' })
  deleteReview(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.adminService.deleteReview(id, user.id, dto.reason);
  }

  /**
   * Added admin service management endpoints for the requested admin service flow.
   * Provider-owned public endpoints cannot list/edit every service, so admin gets
   * JSON-only management actions that preserve ownership and moderation behavior.
   */
  @Get('services')
  @ApiOperation({ summary: 'List all non-deleted services for admin management' })
  listServices() {
    return this.adminService.listServices();
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'View one service for admin management' })
  getService(@Param('id') id: string) {
    return this.adminService.getService(id);
  }

  @Post('services')
  @ApiOperation({ summary: 'Create service as admin for a prestataire' })
  createService(@Body() dto: AdminCreateServiceDto) {
    return this.adminService.createService(dto);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Update a service as admin' })
  updateService(@Param('id') id: string, @Body() dto: AdminUpdateServiceDto) {
    return this.adminService.updateService(id, dto);
  }

  @Delete('services/:id')
  @ApiOperation({ summary: 'Delete service and apply moderation counters' })
  deleteService(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.adminService.deleteService(id, user.id, dto.reason);
  }

  @Patch('prestataires/:id/approve')
  @ApiOperation({ summary: 'Approve prestataire application' })
  approvePrestataire(@Param('id') id: string) {
    return this.adminService.approvePrestataire(id);
  }

  @Patch('prestataires/:id/reject')
  @ApiOperation({ summary: 'Reject prestataire application' })
  rejectPrestataire(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.adminService.rejectPrestataire(id, user.id, dto.reason);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  listUsers() {
    return this.adminService.listUsers();
  }

  /**
   * Added user view/edit/deactivate endpoints to complete admin user management.
   * Suspension stays separate because it has moderation counters/reasons.
   */
  @Get('users/:id')
  @ApiOperation({ summary: 'View one user' })
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/data')
  @ApiOperation({ summary: 'Edit user profile data as admin' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDataDto) {
    return this.adminService.updateUserData(id, dto);
  }

  @Patch('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  deactivateUser(@Param('id') id: string) {
    return this.adminService.setUserActive(id, false);
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Reactivate user account' })
  activateUser(@Param('id') id: string) {
    return this.adminService.setUserActive(id, true);
  }

  @Get('prestataires')
  @ApiOperation({ summary: 'List pending prestataire applications' })
  listPendingPrestataires() {
    return this.adminService.listPendingPrestataires();
  }

  @Patch('users/:id/reinstate')
  @ApiOperation({ summary: 'Reinstate suspended user' })
  reinstateUser(@Param('id') id: string) {
    return this.adminService.reinstateUser(id);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user manually with reason (does not change counters)' })
  suspendUser(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: ReasonDto,
  ) {
    return this.adminService.suspendUser(user.id, id, dto.reason);
  }

  @Patch('users/:id/pardon/service/:amount')
  @ApiOperation({ summary: 'Pardon service deletion counter' })
  pardonServiceCounter(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('amount') amount: string,
  ) {
    return this.adminService.pardonUser(user.id, id, 'service', Number(amount));
  }

  @Patch('users/:id/pardon/review/:amount')
  @ApiOperation({ summary: 'Pardon review deletion counter' })
  pardonReviewCounter(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('amount') amount: string,
  ) {
    return this.adminService.pardonUser(user.id, id, 'review', Number(amount));
  }

  /**
   * Added request oversight endpoints for the admin panel.
   * These are read-only so admins can audit lifecycle state without bypassing
   * client/prestataire transition rules.
   */
  @Get('service-requests')
  @ApiOperation({ summary: 'List all service requests for admin oversight' })
  listServiceRequests() {
    return this.adminService.listServiceRequests();
  }

  @Get('service-requests/:id')
  @ApiOperation({ summary: 'View one service request for admin oversight' })
  getServiceRequest(@Param('id') id: string) {
    return this.adminService.getServiceRequest(id);
  }
}
