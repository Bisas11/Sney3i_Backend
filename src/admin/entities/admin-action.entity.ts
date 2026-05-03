import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AdminActionType, AdminTargetType } from '../../common/enums';

@Entity('admin_actions')
export class AdminAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  admin_id: string;

  @ManyToOne(() => User, (user) => user.admin_actions_made, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column({ type: 'enum', enum: AdminActionType, default: AdminActionType.DELETE })
  action_type: AdminActionType;

  @Column({ type: 'uuid', nullable: true })
  target_id: string | null;

  @Column({ type: 'enum', enum: AdminTargetType, nullable: true })
  target_type: AdminTargetType | null;

  @Column({ type: 'uuid' })
  target_user_id: string;

  @ManyToOne(() => User, (user) => user.admin_actions_received, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  target_user: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'smallint', nullable: true })
  pardon_amount: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
