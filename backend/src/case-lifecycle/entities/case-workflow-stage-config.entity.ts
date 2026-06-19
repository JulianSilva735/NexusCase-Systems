import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('case_workflow_stage_config')
@Unique('uq_case_workflow_stage_key', ['key'])
@Unique('uq_case_workflow_stage_order', ['order'])
export class CaseWorkflowStageConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  key: string;

  @Column({ type: 'varchar', length: 120 })
  label: string;

  @Column({ name: 'stage_order', type: 'int' })
  order: number;

  @Column({ name: 'is_terminal', type: 'boolean', default: false })
  isTerminal: boolean;

  @Column({ name: 'activities', type: 'json', default: () => "'[]'" })
  activities: Array<{ key: string; label: string; weight: number; indicatorKey?: string }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
