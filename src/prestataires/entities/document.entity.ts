import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentType } from '../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  prestataire_id: string;

  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prestataire_id' })
  prestataire: User;

  @Column({ type: 'varchar' })
  doc_url: string;

  @Column({ type: 'enum', enum: DocumentType })
  doc_type: DocumentType;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
