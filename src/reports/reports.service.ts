import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { Service } from '../services/entities/service.entity';
import { Review } from '../reviews/entities/review.entity';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { ReportStatus } from '../common/enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const hasService = Boolean(dto.service_id);
    const hasReview = Boolean(dto.review_id);

    if (hasService === hasReview) {
      throw new BadRequestException('Provide exactly one target: service_id or review_id');
    }

    if (dto.service_id) {
      const service = await this.serviceRepo.findOne({
        where: { id: dto.service_id, deleted_at: IsNull() },
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }
    }

    if (dto.review_id) {
      const review = await this.reviewRepo.findOne({
        where: { id: dto.review_id, deleted_at: IsNull() },
      });
      if (!review) {
        throw new NotFoundException('Review not found');
      }
    }

    const report = this.reportRepo.create({
      reporter_id: reporterId,
      service_id: dto.service_id ?? null,
      review_id: dto.review_id ?? null,
      comment: dto.comment,
      status: ReportStatus.UNSEEN,
    });

    return this.reportRepo.save(report);
  }

  listReports(query: ListReportsQueryDto) {
    const where = query.status ? { status: query.status } : {};
    return this.reportRepo.find({
      where,
      relations: { reporter: true, service: true, review: true },
      order: { created_at: 'DESC' },
    });
  }

  async markSeen(reportId: string) {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = ReportStatus.SEEN;
    return this.reportRepo.save(report);
  }
}
