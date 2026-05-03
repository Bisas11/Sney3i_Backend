import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Review } from '../reviews/entities/review.entity';
import { Service } from '../services/entities/service.entity';
import { Category } from '../categories/entities/category.entity';
import { SousCategory } from '../categories/entities/sous-category.entity';
import { AdminAction } from './entities/admin-action.entity';
import {
  AdminActionType,
  AdminTargetType,
  PrestataireApplicationStatus,
  ServiceRequestStatus,
  ServiceStatus,
  UserRole,
} from '../common/enums';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { User } from '../users/entities/user.entity';
import { PrestataireProfile } from '../prestataires/entities/prestataire-profile.entity';
import { Document } from '../prestataires/entities/document.entity';
import { MailService } from '../mail/mail.service';
import { UpdateUserDataDto } from '../users/dto/update-user-data.dto';
import { AdminCreateServiceDto, AdminUpdateServiceDto } from './dto/admin-service.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(AdminAction)
    private readonly actionRepo: Repository<AdminAction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PrestataireProfile)
    private readonly profileRepo: Repository<PrestataireProfile>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(ServiceRequest)
    private readonly requestRepo: Repository<ServiceRequest>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(SousCategory)
    private readonly sousCategoryRepo: Repository<SousCategory>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Added for admin review moderation pages that need to list reviews directly,
   * not only through user-submitted reports.
   */
  listReviews() {
    return this.reviewRepo.find({
      where: { deleted_at: IsNull() },
      relations: {
        client: true,
        service_request: { service: true },
      },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Added for full admin service management.
   * Public/prestataire service endpoints are owner-scoped, so admin needs its own list/view/edit surface.
   */
  listServices() {
    return this.serviceRepo.find({
      relations: {
        prestataire: true,
        sous_category: { category: true },
      },
      order: { created_at: 'DESC' },
    });
  }

  async getService(serviceId: string) {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId },
      relations: {
        prestataire: true,
        sous_category: { category: true },
      },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async createService(dto: AdminCreateServiceDto) {
    const prestataire = await this.userRepo.findOne({ where: { id: dto.prestataire_id } });
    if (!prestataire || prestataire.role !== UserRole.PRESTATAIRE) {
      throw new BadRequestException('Service owner must be an approved prestataire');
    }

    const service = this.serviceRepo.create({
      prestataire_id: dto.prestataire_id,
      sous_category_id: dto.sous_category_id ?? null,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      image_url: null,
      status: ServiceStatus.ACTIVE,
    });
    return this.serviceRepo.save(service);
  }

  async updateService(serviceId: string, dto: AdminUpdateServiceDto) {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');
    Object.assign(service, dto);
    return this.serviceRepo.save(service);
  }

  /**
   * Added for admin request oversight. This is deliberately read-only; lifecycle transitions
   * still go through ServiceRequestsService so ownership and role rules stay centralized.
   */
  listServiceRequests() {
    return this.requestRepo.find({
      relations: {
        client: true,
        prestataire: true,
        service: true,
        review: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async getServiceRequest(requestId: string) {
    const request = await this.requestRepo.findOne({
      where: { id: requestId },
      relations: {
        client: true,
        prestataire: true,
        service: true,
        review: true,
      },
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async deleteReview(reviewId: string, adminId: string, reason: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    await this.reviewRepo.softDelete(reviewId);

    await this.actionRepo.save({
      admin_id: adminId,
      action_type: AdminActionType.DELETE,
      target_id: reviewId,
      target_type: AdminTargetType.REVIEW,
      target_user_id: review.client_id,
      reason,
      pardon_amount: null,
    });

    const client = await this.userRepo.findOneByOrFail({ id: review.client_id });
    client.deleted_review_count += 1;
    if (client.deleted_review_count >= 5) {
      client.is_suspended = true;
    }
    await this.userRepo.save(client);

    return { deleted: true, suspended: client.is_suspended };
  }

  async deleteService(serviceId: string, adminId: string, reason: string) {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');

    await this.serviceRepo.softDelete(serviceId);

    await this.actionRepo.save({
      admin_id: adminId,
      action_type: AdminActionType.DELETE,
      target_id: serviceId,
      target_type: AdminTargetType.SERVICE,
      target_user_id: service.prestataire_id,
      reason,
      pardon_amount: null,
    });

    const prestataire = await this.userRepo.findOneByOrFail({ id: service.prestataire_id });
    prestataire.deleted_service_count += 1;
    let triggeredAutoSuspend = false;

    if (prestataire.deleted_service_count >= 3) {
      prestataire.is_suspended = true;
      triggeredAutoSuspend = true;
    }

    await this.userRepo.save(prestataire);

    if (triggeredAutoSuspend) {
      await this.applyPrestataireSuspensionSideEffects(prestataire.id);
    }

    return { deleted: true, suspended: prestataire.is_suspended };
  }

  async approvePrestataire(profileId: string) {
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Profile not found');

    profile.application_status = PrestataireApplicationStatus.APPROVED;
    profile.doc_validation = true;
    profile.rejection_reason = null;
    await this.profileRepo.save(profile);

    const user = await this.userRepo.findOneByOrFail({ id: profile.user_id });
    user.role = UserRole.PRESTATAIRE;
    await this.userRepo.save(user);

    if (user.email) {
      await this.mailService.sendNotification(
        user.email,
        'Prestataire application approved',
        'Your prestataire application has been approved. You can now publish services.',
      );
    }

    return { approved: true };
  }

  async rejectPrestataire(profileId: string, adminId: string, reason: string) {
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Profile not found');

    profile.application_status = PrestataireApplicationStatus.REJECTED;
    profile.rejected_at = new Date();
    profile.rejection_reason = reason;
    await this.profileRepo.save(profile);

    await this.actionRepo.save({
      admin_id: adminId,
      action_type: AdminActionType.DELETE,
      target_id: profile.id,
      target_type: null,
      target_user_id: profile.user_id,
      reason,
      pardon_amount: null,
    });

    const user = await this.userRepo.findOne({ where: { id: profile.user_id } });
    if (user?.email) {
      await this.mailService.sendNotification(
        user.email,
        'Prestataire application rejected',
        `Your prestataire application was rejected. Reason: ${reason}`,
      );
    }

    return { rejected: true };
  }

  listUsers() {
    return this.userRepo.find({
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        date_of_birth: true,
        address: true,
        image_url: true,
        role: true,
        is_active: true,
        is_suspended: true,
        is_email_verified: true,
        deleted_review_count: true,
        deleted_service_count: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async getUser(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        date_of_birth: true,
        address: true,
        image_url: true,
        role: true,
        is_active: true,
        is_suspended: true,
        is_email_verified: true,
        deleted_review_count: true,
        deleted_service_count: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserData(userId: string, dto: UpdateUserDataDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, {
      name: dto.name ?? user.name,
      phone_number: dto.phone_number ?? user.phone_number,
      date_of_birth: dto.date_of_birth ?? user.date_of_birth,
      address: dto.address ?? user.address,
    });
    await this.userRepo.save(user);
    return this.getUser(user.id);
  }

  async setUserActive(userId: string, active: boolean) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.is_active = active;
    await this.userRepo.save(user);
    return { active };
  }

  async listPendingPrestataires() {
    const profiles = await this.profileRepo.find({
      where: { application_status: PrestataireApplicationStatus.PENDING },
      relations: { user: true },
      order: { created_at: 'DESC' },
    });

    return Promise.all(
      profiles.map(async (profile) => ({
        ...profile,
        documents: await this.documentRepo.find({
          where: { prestataire_id: profile.user_id },
          order: { created_at: 'DESC' },
        }),
      })),
    );
  }

  async reinstateUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.is_suspended = false;
    await this.userRepo.save(user);
    return { reinstated: true };
  }

  async suspendUser(adminId: string, userId: string, reason: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.is_suspended = true;
    await this.userRepo.save(user);

    await this.actionRepo.save({
      admin_id: adminId,
      action_type: AdminActionType.SUSPEND,
      target_id: null,
      target_type: null,
      target_user_id: userId,
      reason,
      pardon_amount: null,
    });

    return {
      suspended: true,
      deleted_service_count: user.deleted_service_count,
      deleted_review_count: user.deleted_review_count,
    };
  }

  async pardonUser(adminId: string, userId: string, targetType: 'service' | 'review', amount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (targetType === 'service') {
      if (amount < 1 || amount > 3) {
        throw new BadRequestException('Service deletion pardon amount must be between 1 and 3');
      }
      user.deleted_service_count = Math.max(0, user.deleted_service_count - amount);
    } else {
      if (amount < 1 || amount > 5) {
        throw new BadRequestException('Review deletion pardon amount must be between 1 and 5');
      }
      user.deleted_review_count = Math.max(0, user.deleted_review_count - amount);
    }

    await this.userRepo.save(user);

    await this.actionRepo.save({
      admin_id: adminId,
      action_type: AdminActionType.PARDON,
      target_id: null,
      target_type: targetType === 'service' ? AdminTargetType.SERVICE : AdminTargetType.REVIEW,
      target_user_id: user.id,
      reason: `Pardon on ${targetType} counter`,
      pardon_amount: amount,
    });

    return {
      pardoned: true,
      deleted_service_count: user.deleted_service_count,
      deleted_review_count: user.deleted_review_count,
      is_suspended: user.is_suspended,
    };
  }

  private async applyPrestataireSuspensionSideEffects(prestataireId: string) {
    await this.serviceRepo.update({ prestataire_id: prestataireId }, { status: ServiceStatus.SUSPENDED });

    const serviceIds = (
      await this.serviceRepo.find({
        where: { prestataire_id: prestataireId },
        select: { id: true },
      })
    ).map((service) => service.id);

    if (serviceIds.length === 0) {
      return;
    }

    const requests = await this.requestRepo.find({
      where: {
        service_id: In(serviceIds),
        status: In([
          ServiceRequestStatus.PENDING,
          ServiceRequestStatus.ACCEPTED,
          ServiceRequestStatus.IN_PROGRESS,
        ]),
      },
      relations: { client: true },
    });

    for (const request of requests) {
      request.status = ServiceRequestStatus.CANCELLED;
      await this.requestRepo.save(request);
      if (request.client?.email) {
        await this.mailService.sendNotification(
          request.client.email,
          'Service request cancelled',
          'Your request was cancelled because the prestataire account was suspended.',
        );
      }
    }
  }
}
