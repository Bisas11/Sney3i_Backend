import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LocalFileService } from '../common/files/local-file.service';
import { UpdateUserDataDto } from './dto/update-user-data.dto';
import * as bcrypt from 'bcrypt';
import { PrestataireProfile } from '../prestataires/entities/prestataire-profile.entity';
import { PrestataireApplicationStatus } from '../common/enums';

@Injectable()
export class UsersService {
  private static readonly PRESTATAIRE_REAPPLY_COOLDOWN_HOURS = 48;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PrestataireProfile)
    private readonly prestataireProfileRepo: Repository<PrestataireProfile>,
    private readonly localFileService: LocalFileService,
  ) {}

  async me(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfileResponse(user);
  }

  async updateMyData(userId: string, payload: UpdateUserDataDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, {
      name: payload.name ?? user.name,
      phone_number: payload.phone_number ?? user.phone_number,
      date_of_birth: payload.date_of_birth ?? user.date_of_birth,
      address: payload.address ?? user.address,
    });

    const saved = await this.userRepo.save(user);
    return this.toProfileResponse(saved);
  }

  async updateMyImage(userId: string, image?: Express.Multer.File) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!image) {
      throw new BadRequestException('Image is required');
    }

    user.image_url = await this.localFileService.saveImageAsWebp(image, 'users');
    const saved = await this.userRepo.save(user);
    return this.toProfileResponse(saved);
  }

  async changeMyPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    return { updated: true };
  }

  private async toProfileResponse(user: User) {
    return this.buildProfileResponse(user);
  }

  private async buildProfileResponse(user: User) {
    const prestataireProfile = await this.prestataireProfileRepo.findOne({
      where: { user_id: user.id },
    });

    const cooldown = this.getReapplyCooldown(
      prestataireProfile?.application_status,
      prestataireProfile?.rejected_at ?? null,
      prestataireProfile?.rejection_reason ?? null,
    );

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone_number: user.phone_number,
      date_of_birth: user.date_of_birth,
      address: user.address,
      image_url: user.image_url,
      is_active: user.is_active,
      is_suspended: user.is_suspended,
      is_email_verified: user.is_email_verified,
      created_at: user.created_at,
      prestataire_application: prestataireProfile
        ? {
            status: prestataireProfile.application_status,
            title: prestataireProfile.title,
            bio: prestataireProfile.bio,
            doc_validation: prestataireProfile.doc_validation,
            rejected_at: prestataireProfile.rejected_at,
            rejection_reason: prestataireProfile.rejection_reason,
            reapplication_count: prestataireProfile.reapplication_count,
            can_apply:
              prestataireProfile.application_status !== PrestataireApplicationStatus.APPROVED &&
              !cooldown.is_on_cooldown,
            cooldown,
          }
        : null,
    };
  }

  private getReapplyCooldown(
    status: PrestataireApplicationStatus | undefined,
    rejectedAt: Date | null,
    rejectionReason: string | null,
  ) {
    if (status !== PrestataireApplicationStatus.REJECTED || !rejectedAt) {
      return {
        is_on_cooldown: false,
        retry_at: null,
        remaining_seconds: 0,
        remaining_minutes: 0,
        rejection_reason: null,
      };
    }

    const retryAtMs =
      rejectedAt.getTime() + UsersService.PRESTATAIRE_REAPPLY_COOLDOWN_HOURS * 60 * 60 * 1000;
    const remainingMs = Math.max(0, retryAtMs - Date.now());

    return {
      is_on_cooldown: remainingMs > 0,
      retry_at: new Date(retryAtMs).toISOString(),
      remaining_seconds: Math.ceil(remainingMs / 1000),
      remaining_minutes: Math.ceil(remainingMs / (60 * 1000)),
      rejection_reason: rejectionReason,
    };
  }
}
