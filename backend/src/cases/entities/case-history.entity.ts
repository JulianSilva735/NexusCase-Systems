import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Case } from './case.entity';
import { User } from '../../users/entities/user.entity';

@Entity('Historial_Casos')
export class CaseHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Case, (caso) => caso.history)
  @JoinColumn({ name: 'caso_id' })
  case: Case;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  action: string; 

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', enum: ['SYSTEM', 'COMMENT'], default: 'SYSTEM' })
  type: 'SYSTEM' | 'COMMENT';

  @Column({ type: 'text', nullable: true })
  userComment: string;

  @CreateDateColumn({ name: 'fecha' })
  timestamp: Date;
}