import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { FilterServicesDto, ServicesSortBy, SortOrder } from './dto/filter-services.dto';
import { ServiceStatus, UserRole } from '../common/enums';
import { User } from '../users/entities/user.entity';
import { PrestataireProfile } from '../prestataires/entities/prestataire-profile.entity';
import { PrestataireApplicationStatus } from '../common/enums';
import { ServiceDetailsQueryDto } from './dto/service-details-query.dto';
import { Review } from '../reviews/entities/review.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { LocalFileService } from '../common/files/local-file.service';

const SERVICE_DETAILS_REVIEWS_PAGE_SIZE = 5;

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PrestataireProfile)
    private readonly profileRepo: Repository<PrestataireProfile>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ServiceRequest)
    private readonly requestRepo: Repository<ServiceRequest>,
    private readonly localFileService: LocalFileService,
  ) {}

  async create(userId: string, dto: CreateServiceDto, image?: Express.Multer.File) {
    await this.ensurePrestataireReady(userId);
    const imageUrl = image
      ? await this.localFileService.saveImageAsWebp(image, 'services')
      : null;

    const service = this.serviceRepo.create({
      prestataire_id: userId,
      sous_category_id: dto.sous_category_id ?? null,
      title: dto.title,
      description: dto.description,
      price: dto.price,
      image_url: imageUrl,
      status: ServiceStatus.ACTIVE,
    });
    return this.serviceRepo.save(service);
  }

  async update(
    userId: string,
    serviceId: string,
    dto: Partial<CreateServiceDto>,
    image?: Express.Multer.File,
  ) {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');
    if (service.prestataire_id !== userId) {
      throw new ForbiddenException('You can only edit your own services');
    }

    if (image) {
      service.image_url = await this.localFileService.saveImageAsWebp(image, 'services');
    }

    Object.assign(service, dto);
    return this.serviceRepo.save(service);
  }

  async remove(userId: string, serviceId: string, mode: 'pause' | 'delete' = 'pause') {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');
    if (service.prestataire_id !== userId) {
      throw new ForbiddenException('You can only modify your own services');
    }

    if (mode === 'pause') {
      service.status = ServiceStatus.PAUSED;
      await this.serviceRepo.save(service);
      return { paused: true };
    }

    await this.serviceRepo.softDelete(serviceId);
    return { deleted: true };
  }

  async findAll(filters: FilterServicesDto) {
    const qb = this.serviceRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.prestataire', 'p')
      .leftJoinAndSelect('s.sous_category', 'sc')
      .leftJoinAndSelect('sc.category', 'c')
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COALESCE(AVG(r2.score), 0)')
            .from('reviews', 'r2')
            .innerJoin('service_requests', 'sr2', 'sr2.id = r2.service_request_id')
            .where('sr2.service_id = s.id')
            .andWhere('r2.deleted_at IS NULL'),
        'avg_score',
      )
      .where('s.deleted_at IS NULL')
      .andWhere('s.status = :status', { status: ServiceStatus.ACTIVE });

    if (filters.categoryId) {
      qb.andWhere('c.id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.sousCategoryId) {
      qb.andWhere('sc.id = :sousCategoryId', { sousCategoryId: filters.sousCategoryId });
    }

    if (filters.region) {
      qb.andWhere('LOWER(p.address) LIKE LOWER(:region)', { region: `%${filters.region}%` });
    }

    if (filters.q?.trim()) {
      /**
       * Added keyword search for the public shop page.
       * The existing frontend had a search box, but the backend exposed only category/region filters.
       */
      const q = `%${filters.q.trim()}%`;
      qb.andWhere(
        `(
          LOWER(s.title) LIKE LOWER(:q)
          OR LOWER(s.description) LIKE LOWER(:q)
          OR LOWER(p.name) LIKE LOWER(:q)
          OR LOWER(sc.name) LIKE LOWER(:q)
          OR LOWER(c.name) LIKE LOWER(:q)
        )`,
        { q },
      );
    }

    if (filters.sortBy === ServicesSortBy.PRICE) {
      qb.orderBy('s.price', filters.order === SortOrder.ASC ? 'ASC' : 'DESC');
    } else if (filters.sortBy === ServicesSortBy.REVIEWS) {
      qb.orderBy('avg_score', filters.order === SortOrder.ASC ? 'ASC' : 'DESC');
    } else {
      qb.orderBy('s.created_at', filters.order === SortOrder.ASC ? 'ASC' : 'DESC');
    }

    const [data, total] = await qb
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    return { data, total, page: filters.page, limit: filters.limit };
  }

  async findOneWithReviews(serviceId: string, query: ServiceDetailsQueryDto) {
    const hasSearchQuery = Boolean(query.q?.trim());

    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, status: ServiceStatus.ACTIVE },
      relations: {
        prestataire: true,
        sous_category: { category: true },
      },
    });

    if (!service || service.deleted_at) {
      throw new NotFoundException('Service not found');
    }

    const reviewsQb = this.reviewRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.service_request', 'sr')
      .leftJoinAndSelect('r.client', 'client')
      .where('sr.service_id = :serviceId', { serviceId })
      .andWhere('r.deleted_at IS NULL');

    if (hasSearchQuery) {
      const normalizedQuery = query.q!.trim();
      reviewsQb.andWhere(
        '(LOWER(r.commentaire) LIKE LOWER(:qContains) OR LOWER(client.name) LIKE LOWER(:qContains))',
        { qContains: `%${normalizedQuery}%` },
      );

      // Rank results: exact phrase, then prefix matches, then partial matches.
      reviewsQb
        .orderBy(
          `CASE
            WHEN LOWER(r.commentaire) = LOWER(:qExact) OR LOWER(client.name) = LOWER(:qExact) THEN 0
            WHEN LOWER(r.commentaire) LIKE LOWER(:qStarts) OR LOWER(client.name) LIKE LOWER(:qStarts) THEN 1
            ELSE 2
          END`,
          'ASC',
        )
        .addOrderBy('r.created_at', 'DESC')
        .setParameters({
          qExact: normalizedQuery,
          qStarts: `${normalizedQuery}%`,
        });
    } else {
      reviewsQb.orderBy('r.created_at', 'DESC');
    }

    const [reviews, total] = await reviewsQb
      .skip((query.page - 1) * SERVICE_DETAILS_REVIEWS_PAGE_SIZE)
      .take(SERVICE_DETAILS_REVIEWS_PAGE_SIZE)
      .getManyAndCount();

    const aggregateQb = this.reviewRepo
      .createQueryBuilder('r')
      .select('COUNT(r.id)', 'total')
      .addSelect('COALESCE(AVG(r.score), 0)', 'average')
      .innerJoin('r.service_request', 'sr')
      .leftJoin('r.client', 'client')
      .where('sr.service_id = :serviceId', { serviceId })
      .andWhere('r.deleted_at IS NULL');

    if (hasSearchQuery) {
      const normalizedQuery = query.q!.trim();
      aggregateQb.andWhere(
        '(LOWER(r.commentaire) LIKE LOWER(:qContains) OR LOWER(client.name) LIKE LOWER(:qContains))',
        { qContains: `%${normalizedQuery}%` },
      );
    }

    const aggregate = await aggregateQb.getRawOne<{ total: string; average: string }>();

    const pagination = {
      page: query.page,
      limit: SERVICE_DETAILS_REVIEWS_PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / SERVICE_DETAILS_REVIEWS_PAGE_SIZE),
    };

    if (query.page > 1) {
      return {
        search_mode: hasSearchQuery ? 'ranked' : 'default',
        reviews,
        pagination,
      };
    }

    return {
      search_mode: hasSearchQuery ? 'ranked' : 'default',
      service,
      prestataire: service.prestataire,
      reviews,
      review_summary: {
        total: Number(aggregate?.total ?? 0),
        average_score: Number(aggregate?.average ?? 0),
      },
      pagination,
    };
  }

  async findMine(userId: string): Promise<Service[]> {
    return this.serviceRepo.find({
      where: { prestataire_id: userId },
      relations: { sous_category: { category: true } },
      order: { created_at: 'DESC' },
    });
  }

  async resume(userId: string, serviceId: string) {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Service not found');
    if (service.prestataire_id !== userId)
      throw new ForbiddenException('You can only modify your own services');
    if (service.status === ServiceStatus.SUSPENDED)
      throw new BadRequestException('Cannot resume a suspended service — contact admin support');
    service.status = ServiceStatus.ACTIVE;
    await this.serviceRepo.save(service);
    return { resumed: true };
  }

  private async ensurePrestataireReady(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.PRESTATAIRE) {
      throw new ForbiddenException('Only prestataires can create services');
    }

    const profile = await this.profileRepo.findOne({ where: { user_id: userId } });
    if (!profile || profile.application_status !== PrestataireApplicationStatus.APPROVED) {
      throw new BadRequestException('Prestataire profile must be approved');
    }
  }
}
