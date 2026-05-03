import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReportStatus } from '../../common/enums';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reporter_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ type: 'uuid', nullable: true })
  service_id: string | null;

  @ManyToOne(() => Service, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'service_id' })
  service: Service | null;

  @Column({ type: 'uuid', nullable: true })
  review_id: string | null;

  @ManyToOne(() => Review, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'review_id' })
  review: Review | null;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.UNSEEN })
  status: ReportStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
