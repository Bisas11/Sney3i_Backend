import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrestataireProfile } from './entities/prestataire-profile.entity';
import { Document } from './entities/document.entity';
import { DocumentType, PrestataireApplicationStatus } from '../common/enums';
import { SubmitPrestataireApplicationDto } from './dto/submit-prestataire-application.dto';
import { LocalFileService } from '../common/files/local-file.service';
import { UpdatePrestataireProfileDto } from './dto/update-prestataire-profile.dto';

@Injectable()
export class PrestatairesService {
  constructor(
    @InjectRepository(PrestataireProfile)
    private readonly profileRepo: Repository<PrestataireProfile>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    private readonly localFileService: LocalFileService,
  ) {}

  /**
   * Added for the frontend's merged prestataire profile + verification page.
   * It returns the profile with documents so the UI can show status and metadata in one call.
   */
  async getMyProfile(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { user_id: userId },
      relations: { user: true },
    });
    if (!profile) {
      throw new NotFoundException('Prestataire profile not found');
    }

    const documents = await this.documentRepo.find({
      where: { prestataire_id: userId },
      order: { created_at: 'DESC' },
    });

    return { ...profile, documents };
  }

  /**
   * Added for profile editing without forcing document re-submission.
   * Application state and document validation remain admin-controlled.
   */
  async updateMyProfile(userId: string, dto: UpdatePrestataireProfileDto) {
    const profile = await this.profileRepo.findOne({ where: { user_id: userId } });
    if (!profile) {
      throw new NotFoundException('Prestataire profile not found');
    }

    profile.title = dto.title ?? profile.title;
    profile.bio = dto.bio ?? profile.bio;
    return this.profileRepo.save(profile);
  }

  async submitApplication(
    userId: string,
    dto: SubmitPrestataireApplicationDto,
    documents: Express.Multer.File[],
  ) {
    if (!documents?.length) {
      throw new BadRequestException('At least one document is required');
    }

    const documentTypes = this.parseDocTypes(dto.doc_types, documents.length);

    const profile = await this.profileRepo.findOne({ where: { user_id: userId } });

    if (!profile) {
      const createdProfile = await this.profileRepo.save(
        this.profileRepo.create({
          user_id: userId,
          title: dto.title,
          bio: dto.bio,
          application_status: PrestataireApplicationStatus.PENDING,
          rejection_reason: null,
        }),
      );

      await this.replaceDocuments(userId, documents, documentTypes);
      return {
        mode: 'apply',
        profile: createdProfile,
      };
    }

    if (profile.application_status === PrestataireApplicationStatus.APPROVED) {
      throw new BadRequestException('Prestataire is already approved');
    }

    if (profile.application_status === PrestataireApplicationStatus.PENDING) {
      profile.title = dto.title;
      profile.bio = dto.bio;
      const savedPendingProfile = await this.profileRepo.save(profile);
      await this.replaceDocuments(userId, documents, documentTypes);
      return {
        mode: 'update_pending',
        profile: savedPendingProfile,
      };
    }

    if (profile.rejected_at) {
      const cooldownEnd = profile.rejected_at.getTime() + 48 * 60 * 60 * 1000;
      if (Date.now() < cooldownEnd) {
        const remainingMs = cooldownEnd - Date.now();
        throw new BadRequestException({
          message: 'Reapplication cooldown is 48 hours',
          retry_at: new Date(cooldownEnd).toISOString(),
          remaining_seconds: Math.ceil(remainingMs / 1000),
          remaining_minutes: Math.ceil(remainingMs / (60 * 1000)),
        });
      }
    }

    profile.application_status = PrestataireApplicationStatus.PENDING;
    profile.reapplication_count += 1;
    profile.title = dto.title;
    profile.bio = dto.bio;
    profile.rejection_reason = null;

    const savedReappliedProfile = await this.profileRepo.save(profile);
    await this.replaceDocuments(userId, documents, documentTypes);

    return {
      mode: 'reapply',
      profile: savedReappliedProfile,
    };
  }

  private parseDocTypes(docTypes: SubmitPrestataireApplicationDto['doc_types'], filesCount: number) {
    if (!docTypes || docTypes.length === 0) {
      throw new BadRequestException('doc_types is required and must include one type per document');
    }

    if (docTypes.length !== filesCount) {
      throw new BadRequestException('doc_types length must match uploaded documents length');
    }

    return docTypes;
  }

  private async replaceDocuments(
    userId: string,
    documents: Express.Multer.File[],
    docTypes: DocumentType[],
  ) {
    await this.documentRepo.delete({ prestataire_id: userId });

    const savedDocs = await Promise.all(documents.map((doc) => this.localFileService.saveDocument(doc)));

    const entities = savedDocs.map((savedDoc, index) =>
      this.documentRepo.create({
        prestataire_id: userId,
        doc_url: savedDoc.url,
        doc_type: docTypes[index],
      }),
    );

    await this.documentRepo.save(entities);
  }
}
