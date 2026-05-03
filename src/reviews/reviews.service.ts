import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { ServiceRequestStatus } from '../common/enums';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ServiceRequest)
    private readonly requestRepo: Repository<ServiceRequest>,
  ) {}

  async create(clientId: string, dto: CreateReviewDto) {
    const request = await this.requestRepo.findOne({ where: { id: dto.service_request_id } });
    if (!request || request.client_id !== clientId) {
      throw new BadRequestException('Invalid service request');
    }

    /**
     * Changed to match the product flow: completed or cancelled requests may be reviewed.
     * Pending/active/rejected requests remain ineligible.
     */
    if (![ServiceRequestStatus.DONE, ServiceRequestStatus.CANCELLED].includes(request.status)) {
      throw new BadRequestException('Review can be submitted only when request is done or cancelled');
    }

    const existing = await this.reviewRepo.findOne({
      where: { service_request_id: dto.service_request_id },
    });
    if (existing) {
      throw new BadRequestException('A review already exists for this request');
    }

    const review = this.reviewRepo.create({
      service_request_id: dto.service_request_id,
      client_id: clientId,
      score: dto.score,
      commentaire: dto.commentaire ?? null,
    });

    return this.reviewRepo.save(review);
  }

  listForPrestataire(prestataireId: string) {
    /**
     * Changed to include client and service relations for the prestataire reviews page.
     * The UI needs rating, comment, service name, client name, and date in one call.
     */
    return this.reviewRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.service_request', 'sr')
      .innerJoinAndSelect('sr.service', 's')
      .leftJoinAndSelect('r.client', 'client')
      .where('sr.prestataire_id = :prestataireId', { prestataireId })
      .andWhere('r.deleted_at IS NULL')
      .orderBy('r.created_at', 'DESC')
      .getMany();
  }
}
