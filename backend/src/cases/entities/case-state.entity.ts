import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('Estados_Caso')
export class CaseState {
  @PrimaryColumn()
  id: string;

  @Column()
  label: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int', default: 3 })
  maxDays: number;

  @Column({ type: 'int', default: 0 })
  order: number;
}