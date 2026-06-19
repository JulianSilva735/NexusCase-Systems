import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Case } from '../../cases/entities/case.entity';
import { User } from '../../users/entities/user.entity';
import { LifecycleSource } from '../case-lifecycle.constants';

@Entity('case_lifecycle_snapshot')
export class CaseLifecycleSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'case_id' })
  @Index('uq_case_lifecycle_snapshot_case_id', { unique: true })
  case: Case;

  @Column({ name: 'current_stage', type: 'varchar', length: 80 })
  currentStage: string;

  @Column({ name: 'current_stage_label', type: 'varchar', length: 120 })
  currentStageLabel: string;

  @Column({ name: 'auto_stage', type: 'varchar', length: 80, nullable: true })
  autoStage: string | null;

  @Column({ name: 'source', type: 'varchar', enum: LifecycleSource, default: LifecycleSource.AUTO })
  source: LifecycleSource;

  @Column({ name: 'manual_override_active', type: 'boolean', default: false })
  manualOverrideActive: boolean;

  @Column({ name: 'manual_override_stage', type: 'varchar', length: 80, nullable: true })
  manualOverrideStage: string | null;

  @Column({ name: 'manual_override_reason', type: 'text', nullable: true })
  manualOverrideReason: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manual_override_user_id' })
  manualOverrideUser: User | null;

  @Column({ name: 'manual_override_at', type: 'datetime', nullable: true })
  manualOverrideAt: Date | null;

  @Column({ name: 'last_recalculated_at', type: 'datetime', nullable: true })
  lastRecalculatedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
