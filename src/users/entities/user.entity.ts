import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums';
import { PrestataireProfile } from '../../prestataires/entities/prestataire-profile.entity';
import { Service } from '../../services/entities/service.entity';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Document } from '../../prestataires/entities/document.entity';
import { AdminAction } from '../../admin/entities/admin-action.entity';
import { EmailToken } from '../../auth/entities/email-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  phone_number: string | null;

  @Column({ type: 'date', nullable: true })
  date_of_birth: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', nullable: true })
  image_url: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_suspended: boolean;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  @Column({ type: 'smallint', default: 0 })
  deleted_review_count: number;

  @Column({ type: 'smallint', default: 0 })
  deleted_service_count: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @OneToOne(() => PrestataireProfile, (profile) => profile.user)
  prestataire_profile: PrestataireProfile;

  @OneToMany(() => Service, (service) => service.prestataire)
  services: Service[];

  @OneToMany(() => ServiceRequest, (request) => request.client)
  client_requests: ServiceRequest[];

  @OneToMany(() => ServiceRequest, (request) => request.prestataire)
  prestataire_requests: ServiceRequest[];

  @OneToMany(() => Review, (review) => review.client)
  reviews: Review[];

  @OneToMany(() => Document, (document) => document.prestataire)
  documents: Document[];

  @OneToMany(() => AdminAction, (action) => action.admin)
  admin_actions_made: AdminAction[];

  @OneToMany(() => AdminAction, (action) => action.target_user)
  admin_actions_received: AdminAction[];

  @OneToMany(() => EmailToken, (token) => token.user)
  email_tokens: EmailToken[];
}
