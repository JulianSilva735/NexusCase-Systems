import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Case } from './case.entity';

@Entity('Actividades_Caso')
export class CaseActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Case, (caso) => caso.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caso_id' })
  case: Case;

  @Column({ type: 'varchar', length: 50 })
  activityKey: string;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;
}