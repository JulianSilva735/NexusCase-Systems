import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Case } from '../../cases/entities/case.entity';
import { DocumentStatus } from './document-status.enum';

@Entity('documents')
@Index(['case', 'type'], { unique: true })
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  type: string; 

  @Column({ name: 'original_name', type: 'varchar', nullable: true })
  originalName: string | null;

  @Column({ type: 'text', nullable: true })
  url: string; 

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType: string | null;

  @Column({ default: 1 })
  version: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  path?: string;

  @Column({
    type: 'varchar',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @ManyToOne(() => Case, (c) => c.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  case: Case;
}