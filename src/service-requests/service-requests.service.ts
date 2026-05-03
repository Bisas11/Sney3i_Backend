import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { Service } from '../services/entities/service.entity';
import { ServiceRequestStatus, ServiceStatus } from '../common/enums';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';

const ALLOWED_TRANSITIONS: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  [ServiceRequestStatus.PENDING]: [
    ServiceRequestStatus.ACCEPTED,
    ServiceRequestStatus.REJECTED,
    ServiceRequestStatus.CANCELLED,
  ],
  [ServiceRequestStatus.ACCEPTED]: [ServiceRequestStatus.IN_PROGRESS, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.IN_PROGRESS]: [ServiceRequestStatus.DONE, ServiceRequestStatus.CANCELLED],
  [ServiceRequestStatus.DONE]: [],
  [ServiceRequestStatus.REJECTED]: [],
  [ServiceRequestStatus.CANCELLED]: [],
};

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly requestRepo: Repository<ServiceRequest>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async create(clientId: string, dto: CreateServiceRequestDto) {
    const service = await this.serviceRepo.findOne({ where: { id: dto.service_id } });
    if (!service || service.deleted_at || service.status !== ServiceStatus.ACTIVE) {
      throw new NotFoundException('Service not found');
    }

    if (service.prestataire_id === clientId) {
      throw new BadRequestException('Cannot request your own service');
    }

    /**
     * Changed from provider-level blocking to service-level blocking.
     * A client may have active requests with the same prestataire for different services,
     * but cannot duplicate an open request for this exact service.
     */
    const existingOpen = await this.requestRepo.findOne({
      where: {
        client_id: clientId,
        service_id: service.id,
        status: In([
          ServiceRequestStatus.PENDING,
          ServiceRequestStatus.ACCEPTED,
          ServiceRequestStatus.IN_PROGRESS,
        ]),
      },
    });

    if (existingOpen) {
      throw new BadRequestException('You already have an active request for this service');
    }

    const request = this.requestRepo.create({
      service_id: service.id,
      client_id: clientId,
      prestataire_id: service.prestataire_id,
      status: ServiceRequestStatus.PENDING,
      client_message: dto.client_message ?? null,
    });

    const saved = await this.requestRepo.save(request);
    const prestataire = await this.userRepo.findOne({ where: { id: service.prestataire_id } });
    if (prestataire) {
      await this.mailService.sendNotification(
        prestataire.email,
        'New service request',
        `You received a new request for service ${service.title}`,
      );
    }

    return saved;
  }

  async transition(userId: string, requestId: string, nextStatus: ServiceRequestStatus) {
    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');

    const isClient = request.client_id === userId;
    const isPrestataire = request.prestataire_id === userId;
    if (!isClient && !isPrestataire) {
      throw new ForbiddenException('Not your request');
    }

    if (nextStatus === ServiceRequestStatus.ACCEPTED) {
      if (!isPrestataire) {
        throw new ForbiddenException('Only prestataire can accept');
      }
      this.assertTransition(request.status, ServiceRequestStatus.ACCEPTED);
      request.status = ServiceRequestStatus.ACCEPTED;
      return this.requestRepo.save(request);
    }

    if (nextStatus === ServiceRequestStatus.REJECTED) {
      if (!isPrestataire) {
        throw new ForbiddenException('Only prestataire can reject');
      }
      this.assertTransition(request.status, ServiceRequestStatus.REJECTED);
      request.status = ServiceRequestStatus.REJECTED;
      const saved = await this.requestRepo.save(request);
      const client = await this.userRepo.findOne({ where: { id: request.client_id } });
      if (client) {
        await this.mailService.sendNotification(client.email, 'Request rejected', 'Your request was rejected');
      }
      return saved;
    }

    if (nextStatus === ServiceRequestStatus.IN_PROGRESS) {
      /**
       * Added missing accepted -> in_progress transition.
       * The state machine already declared it as valid, but the handler never executed it.
       */
      if (!isPrestataire) {
        throw new ForbiddenException('Only prestataire can start a request');
      }
      this.assertTransition(request.status, ServiceRequestStatus.IN_PROGRESS);
      request.status = ServiceRequestStatus.IN_PROGRESS;
      return this.requestRepo.save(request);
    }

    if (nextStatus === ServiceRequestStatus.DONE) {
      if (!isPrestataire) {
        throw new ForbiddenException('Only prestataire can mark done');
      }
      if (request.status !== ServiceRequestStatus.IN_PROGRESS) {
        throw new BadRequestException('Only in-progress requests can be completed');
      }
      request.status = ServiceRequestStatus.DONE;
      const saved = await this.requestRepo.save(request);
      const client = await this.userRepo.findOne({ where: { id: request.client_id } });
      if (client) {
        await this.mailService.sendNotification(
          client.email,
          'Service done',
          'Your request is done. You can leave a review.',
        );
      }
      return saved;
    }

    if (nextStatus === ServiceRequestStatus.CANCELLED) {
      if (isClient && request.status !== ServiceRequestStatus.PENDING) {
        throw new BadRequestException('Client can only cancel pending requests');
      }

      if (
        isPrestataire &&
        ![ServiceRequestStatus.ACCEPTED, ServiceRequestStatus.IN_PROGRESS].includes(request.status)
      ) {
        throw new BadRequestException('Prestataire can cancel only accepted or in-progress requests');
      }

      request.status = ServiceRequestStatus.CANCELLED;
      return this.requestRepo.save(request);
    }

    throw new BadRequestException('Unsupported status transition request');
  }

  myHistory(clientId: string) {
    return this.requestRepo.find({
      where: { client_id: clientId },
      relations: { review: true, service: true, prestataire: true },
      order: { created_at: 'DESC' },
    }).then((requests) => requests.map((request) => this.mapClientHistory(request)));
  }

  myMissions(prestataireId: string) {
    return this.requestRepo.find({
      where: { prestataire_id: prestataireId },
      relations: { service: true, client: true },
      order: { created_at: 'DESC' },
    }).then((requests) => requests.map((request) => this.mapPrestataireMission(request)));
  }

  async history(clientId: string) {
    return this.myHistory(clientId);
  }

  async missions(prestataireId: string) {
    return this.myMissions(prestataireId);
  }

  async historyById(clientId: string, requestId: string) {
    const request = await this.requestRepo.findOne({
      where: { id: requestId, client_id: clientId },
      relations: { service: true, prestataire: true, review: true },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return this.mapClientHistory(request);
  }

  async missionById(prestataireId: string, requestId: string) {
    const request = await this.requestRepo.findOne({
      where: { id: requestId, prestataire_id: prestataireId },
      relations: { service: true, client: true, review: true },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return this.mapPrestataireMission(request);
  }

  private assertTransition(current: ServiceRequestStatus, next: ServiceRequestStatus) {
    if (!ALLOWED_TRANSITIONS[current]?.includes(next)) {
      throw new BadRequestException(`Cannot transition from ${current} to ${next}`);
    }
  }

  private mapClientHistory(request: ServiceRequest) {
    return {
      id: request.id,
      status: request.status,
      start_date: request.created_at,
      client_message: request.client_message ?? null,
      service: request.service
        ? {
            id: request.service.id,
            title: request.service.title,
            description: request.service.description,
            price: request.service.price,
            image_url: request.service.image_url,
          }
        : null,
      prestataire: request.prestataire
        ? {
            id: request.prestataire.id,
            name: request.prestataire.name,
            email: request.prestataire.email,
            phone_number: request.prestataire.phone_number,
            image_url: request.prestataire.image_url,
          }
        : null,
      can_cancel: request.status === ServiceRequestStatus.PENDING,
      can_review:
        [ServiceRequestStatus.DONE, ServiceRequestStatus.CANCELLED].includes(request.status) &&
        !request.review,
      review_id: request.review?.id ?? null,
    };
  }

  private mapPrestataireMission(request: ServiceRequest) {
    return {
      id: request.id,
      status: request.status,
      start_date: request.created_at,
      client_message: request.client_message ?? null,
      service: request.service
        ? {
            id: request.service.id,
            title: request.service.title,
            description: request.service.description,
            price: request.service.price,
            image_url: request.service.image_url,
          }
        : null,
      client: request.client
        ? {
            id: request.client.id,
            name: request.client.name,
            email: request.client.email,
            phone_number: request.client.phone_number,
            image_url: request.client.image_url,
          }
        : null,
      allowed_next_statuses: ALLOWED_TRANSITIONS[request.status],
    };
  }

}
