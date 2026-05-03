import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { User } from '../../users/entities/user.entity';
import { ServiceRequestStatus } from '../../common/enums';
import { Review } from '../../reviews/entities/review.entity';

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @ManyToOne(() => Service, (service) => service.requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'uuid' })
  client_id: string;

  @ManyToOne(() => User, (user) => user.client_requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ type: 'uuid' })
  prestataire_id: string;

  @ManyToOne(() => User, (user) => user.prestataire_requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prestataire_id' })
  prestataire: User;

  @Column({ type: 'enum', enum: ServiceRequestStatus, default: ServiceRequestStatus.PENDING })
  status: ServiceRequestStatus;

  @Column({ type: 'text', nullable: true })
  client_message: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToOne(() => Review, (review) => review.service_request)
  review: Review;
}
