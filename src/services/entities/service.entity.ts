import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SousCategory } from '../../categories/entities/sous-category.entity';
import { ServiceStatus } from '../../common/enums';
import { ServiceRequest } from '../../service-requests/entities/service-request.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  prestataire_id: string;

  @ManyToOne(() => User, (user) => user.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prestataire_id' })
  prestataire: User;

  @Column({ type: 'uuid', nullable: true })
  sous_category_id: string | null;

  @ManyToOne(() => SousCategory, (sub) => sub.services, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sous_category_id' })
  sous_category: SousCategory;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: string;

  @Column({ type: 'varchar', nullable: true })
  image_url: string | null;

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.ACTIVE })
  status: ServiceStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @OneToMany(() => ServiceRequest, (request) => request.service)
  requests: ServiceRequest[];
}
