import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Case } from '../../cases/entities/case.entity';

@Entity('case_activity_progress')
@Unique('uq_case_activity_progress_case_activity', ['case', 'activityKey'])
export class CaseActivityProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  @Index('idx_case_activity_progress_case_id')
  case: Case;

  @Column({ name: 'activity_key', type: 'varchar', length: 120 })
  activityKey: string;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'varchar', length: 120, nullable: true })
  source: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
