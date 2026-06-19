import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Case } from '../../cases/entities/case.entity';
import { User } from '../../users/entities/user.entity';
import { LifecycleSource } from '../case-lifecycle.constants';

@Entity('case_lifecycle_history')
export class CaseLifecycleHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  @Index('idx_case_lifecycle_history_case_id')
  case: Case;

  @Column({ name: 'from_stage', type: 'varchar', length: 80, nullable: true })
  fromStage: string | null;

  @Column({ name: 'to_stage', type: 'varchar', length: 80 })
  toStage: string;

  @Column({ name: 'source', type: 'varchar', enum: LifecycleSource })
  source: LifecycleSource;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
